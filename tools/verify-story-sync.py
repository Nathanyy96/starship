"""Verify that the game story/roster and the maintained design document agree."""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

from docx import Document


ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "星界之律遊戲設定總覽-劇情修訂版.docx"
NODE_DEFAULT = Path(
    r"C:\Users\natha\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
)


def load_game_data() -> dict:
    node = Path(os.environ.get("STARSHIP_NODE", str(NODE_DEFAULT)))
    if not node.exists():
        node = Path("node")
    export_script = (
        "import('./src/data.js').then(({default:d}) => "
        "process.stdout.write(JSON.stringify({cards:Object.values(d.cards), "
        "activeCards:d.activeCards, futureCards:d.futureCards, "
        "story:d.storyChapters, replan:d.storyReplan}))).catch((error) => { console.error(error); process.exit(1); })"
    )
    result = subprocess.run(
        [str(node), "--input-type=module", "-e", export_script],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return json.loads(result.stdout)


def document_text() -> str:
    document = Document(DOC)
    chunks = [paragraph.text for paragraph in document.paragraphs]
    chunks.extend(
        cell.text
        for table in document.tables
        for row in table.rows
        for cell in row.cells
    )
    return "\n".join(chunks)


def scene_strings(chapter: dict) -> list[str]:
    return [scene.get("body", "").strip() for scene in chapter.get("scenes", []) if scene.get("body")]


def main() -> None:
    data = load_game_data()
    text = document_text()
    stories = data["story"]
    cards = data["cards"]
    future_stories = [chapter for chapter in stories if float(chapter["version"]) >= 3]
    replan_id = (data.get("replan") or {}).get("id")
    replanned_stories = [chapter for chapter in stories if chapter.get("storyRevisionId") == replan_id and float(chapter["version"]) >= 1.1]
    future_cards = [card for card in cards if float(card["releaseVersion"]) >= 3]
    live_cards = [card for card in cards if float(card["releaseVersion"]) <= 2.5]

    missing_titles = [
        chapter["title"]
        for chapter in stories
        if chapter.get("title") not in text
    ]
    missing_side_titles = [
        chapter["title"]
        for chapter in stories
        if chapter.get("type") == "side" and chapter.get("title") not in text
    ]
    # Full scene text is required for the newly appended future chapters. The
    # earlier chapters are preserved in the base/old document draft.
    missing_future_scenes = [
        f"{chapter['id']}:{index + 1}"
        for chapter in future_stories
        for index, body in enumerate(scene_strings(chapter))
        if body not in text
    ]
    missing_replanned_scenes = [
        f"{chapter['id']}:{index + 1}"
        for chapter in replanned_stories
        for index, body in enumerate(scene_strings(chapter))
        if body not in text
    ]
    missing_card_names = [card["name"] for card in cards if card["name"] not in text]
    version_counts = {}
    major_version_counts = {}
    for chapter in stories:
        entry = version_counts.setdefault(chapter["version"], {"main": 0, "side": 0})
        entry[chapter.get("type", "main")] += 1
        major = str(int(float(chapter["version"])))
        major_entry = major_version_counts.setdefault(major, {"main": 0, "side": 0})
        major_entry[chapter.get("type", "main")] += 1

    checks = {
        "story_chapters": len(stories),
        "future_story_chapters": len(future_stories),
        "replanned_story_chapters": len(replanned_stories),
        "future_chapters_locked": all(chapter.get("releaseOpen") is False for chapter in future_stories),
        "each_major_version_has_main_and_merged_side": all(
            counts["main"] >= 1 and counts["side"] >= 1
            for counts in major_version_counts.values()
        ),
        "story_versions": sorted(version_counts),
        "card_records": len(cards),
        "future_card_records": len(future_cards),
        "live_card_records": len(live_cards),
        "active_cards_match_boundary": all(float(card["releaseVersion"]) <= 2.5 for card in data["activeCards"]),
        "future_cards_not_live": not set(card["id"] for card in data["activeCards"]).intersection(
            card["id"] for card in future_cards
        ),
        "document_missing_main_titles": missing_titles,
        "document_missing_side_titles": missing_side_titles,
        "document_missing_card_names": missing_card_names,
        "document_missing_future_scene_bodies": missing_future_scenes,
        "document_missing_replanned_scene_bodies": missing_replanned_scenes,
    }
    print(json.dumps(checks, ensure_ascii=False, indent=2))
    list_checks = {
        "document_missing_main_titles",
        "document_missing_side_titles",
        "document_missing_card_names",
        "document_missing_future_scene_bodies",
        "document_missing_replanned_scene_bodies",
    }
    failures = [
        key
        for key, value in checks.items()
        if (key in list_checks and value) or (isinstance(value, bool) and not value)
    ]
    if failures:
        raise SystemExit(f"Story sync failed: {', '.join(failures)}")


if __name__ == "__main__":
    main()

"""Audit story continuity, geography coverage and chapter-to-map wiring."""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
NODE_DEFAULT = Path(
    r"C:\Users\natha\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
)


def load_game_data() -> dict:
    node = Path(os.environ.get("STARSHIP_NODE", str(NODE_DEFAULT)))
    if not node.exists():
        node = Path("node")
    script = (
        "const d=require('./src/data.js'); process.stdout.write(JSON.stringify({"
        "story:d.storyChapters,map:d.storyWorldMap}));"
    )
    result = subprocess.run(
        [str(node), "-e", script],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return json.loads(result.stdout)


def body_text(chapter: dict) -> str:
    return "\n".join(
        [str(chapter.get("summary", ""))]
        + [str(scene.get("body", "")) for scene in chapter.get("scenes", [])]
    )


def version_key(chapter: dict) -> tuple[float, int]:
    return (float(chapter.get("version", 0)), 0 if chapter.get("type") == "main" else 1)


def main() -> None:
    data = load_game_data()
    stories = data.get("story", [])
    map_data = data.get("map") or {}
    locations = {item.get("id"): item for item in map_data.get("locations", [])}
    regions = {item.get("id"): item for item in map_data.get("regions", [])}
    chapter_locations = map_data.get("chapterLocations", {})
    aliases = map_data.get("regionAliases", {})
    failures: list[str] = []

    story_ids = [chapter.get("id") for chapter in stories]
    if len(story_ids) != len(set(story_ids)):
        failures.append("story chapter ids are not unique")
    for chapter in stories:
        chapter_id = chapter.get("id")
        if not chapter.get("narrativeGuide"):
            failures.append(f"{chapter_id} is missing narrativeGuide")
        if len(chapter.get("scenes", [])) < 3:
            failures.append(f"{chapter_id} has fewer than three scenes")
        if not str(chapter.get("fullBody", "")).strip():
            failures.append(f"{chapter_id} is missing fullBody")
        if chapter_id not in chapter_locations:
            failures.append(f"{chapter_id} is not mapped to a world location")
        for location_id in chapter_locations.get(chapter_id, []):
            if location_id not in locations:
                failures.append(f"{chapter_id} points to unknown map location {location_id}")
        if chapter.get("region") not in aliases:
            failures.append(f"{chapter_id} region is not covered by map aliases: {chapter.get('region')}")

    missing_map_chapters = sorted(set(story_ids) - set(chapter_locations))
    extra_map_chapters = sorted(set(chapter_locations) - set(story_ids))
    if missing_map_chapters:
        failures.append("map is missing chapters: " + ", ".join(missing_map_chapters))
    if extra_map_chapters:
        failures.append("map contains unknown chapters: " + ", ".join(extra_map_chapters))

    for location_id, location in locations.items():
        if location.get("regionId") not in regions:
            failures.append(f"{location_id} points to unknown region {location.get('regionId')}")
    graph = {location_id: set() for location_id in locations}
    for route in map_data.get("routes", []):
        source = route.get("from")
        target = route.get("to")
        if source not in locations or target not in locations:
            failures.append(f"route {route.get('id')} has an unknown endpoint")
            continue
        graph[source].add(target)
        graph[target].add(source)
    if locations:
        reachable = set()
        pending = ["beast-village"]
        while pending:
            current = pending.pop()
            if current in reachable:
                continue
            reachable.add(current)
            pending.extend(graph.get(current, set()) - reachable)
        disconnected = sorted(set(locations) - reachable)
        if disconnected:
            failures.append("disconnected map locations: " + ", ".join(disconnected))

    by_id = {chapter.get("id"): chapter for chapter in stories}
    bridge_checks = [
        ("main-1-0", "main-1-1", ("獸靈", "旋律", "回覆")),
        ("main-2.5", "main-3-0", ("潮眼", "霽光", "回返")),
        ("main-3-5", "main-4.0", ("第一頁", "終端", "根圖")),
        ("main-4.5", "main-5.0", ("第二條律", "長冬", "根冠")),
        ("main-5.4", "main-5.5", ("深海", "回信", "終端")),
    ]
    bridge_results = []
    for previous_id, next_id, keywords in bridge_checks:
        previous = by_id.get(previous_id)
        next_chapter = by_id.get(next_id)
        matched = [keyword for keyword in keywords if keyword in body_text(next_chapter or {})]
        ok = bool(previous and next_chapter and matched)
        bridge_results.append({"from": previous_id, "to": next_id, "matchedKeywords": matched, "ok": ok})
        if not ok:
            failures.append(f"continuity bridge missing between {previous_id} and {next_id}")

    version_order = [chapter.get("id") for chapter in sorted(stories, key=version_key)]
    expected_order = [chapter.get("id") for chapter in stories]
    if expected_order != version_order:
        failures.append("story chapters are not ordered by version and main/side sequence")

    result = {
        "storyChapters": len(stories),
        "mapLocations": len(locations),
        "mapRegions": len(regions),
        "mapRoutes": len(map_data.get("routes", [])),
        "allChaptersHaveThreeScenes": not any("fewer than three scenes" in failure for failure in failures),
        "allChaptersMapped": not missing_map_chapters and not extra_map_chapters,
        "allRegionsCovered": not any("region is not covered" in failure for failure in failures),
        "mapConnected": not any("disconnected map locations" in failure for failure in failures),
        "storyOrderStable": expected_order == version_order,
        "continuityBridges": bridge_results,
        "failures": failures,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if failures:
        raise SystemExit("Story coherence audit failed: " + "; ".join(failures))


if __name__ == "__main__":
    main()

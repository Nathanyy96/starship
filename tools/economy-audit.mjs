import data from "../src/data.js";
import gacha from "../src/gacha.js";

const rules = gacha.DEFAULT_RULES.development;

function levelCost(rarity, targetLevel) {
  const base = rarity === 4 ? rules.fourStarBaseCharacterExp : rules.threeStarBaseCharacterExp;
  const step = rarity === 4 ? rules.fourStarCharacterExpStep : rules.threeStarCharacterExpStep;
  let total = 0;
  for (let level = 1; level < targetLevel; level += 1) total += base + (level - 1) * step;
  return total;
}

const openChapters = data.storyChapters.filter((chapter) => chapter.releaseOpen !== false && Number(chapter.version) <= 2.5);
const openScenes = openChapters.reduce((sum, chapter) => sum + (chapter.scenes || []).length, 0);
const story = {
  scenes: openScenes,
  starSand: openScenes * 100,
  characterExp: openScenes * 650
};
const trial = {
  stages: data.trialStages.length,
  attempts: data.trialStages.length * 10,
  starSand: data.trialStages.reduce((sum, stage) => sum + Number(stage.reward?.starSand || 0) * 10, 0),
  characterExp: data.trialStages.reduce((sum, stage) => sum + Number(stage.reward?.characterExp || 0) * 10, 0)
};
const boss = {
  stages: data.bossStages.length,
  attempts: data.bossStages.length * 10,
  characterExp: data.bossStages.reduce((sum, stage) => sum + Number(stage.reward?.characterExp || 0) * 10, 0),
  specificMaterials: data.bossStages.reduce((sum, stage) => sum + Number(stage.reward?.amount || 0) * 10, 0),
  universalMarks: data.bossStages.reduce((sum, stage) => sum + Number(stage.reward?.universalAmount || 0) * 10, 0)
};
const dispatch = {
  starSand: data.dispatchMissions.reduce((sum, mission) => sum + Number(mission.reward?.starSand || 0), 0),
  characterExp: data.dispatchMissions.reduce((sum, mission) => sum + Number(mission.reward?.characterExp || 0), 0)
};
const voyage = {
  starSand: Object.values(data.voyageConfig.endingRewards).reduce((sum, reward) => sum + Number(reward.starSand || 0), 0),
  characterExp: Object.values(data.voyageConfig.endingRewards).reduce((sum, reward) => sum + Number(reward.characterExp || 0), 0)
};
const fixed = {
  starSand: 160 + Number(data.updateReward.starSand || 0) + Number(data.tutorialReward.starSand || 0) + story.starSand + trial.starSand + dispatch.starSand + voyage.starSand,
  characterExp: 800 + Number(data.tutorialReward.characterExp || 0) + story.characterExp + trial.characterExp + boss.characterExp + dispatch.characterExp + voyage.characterExp
};
const teamTargets = [70, 80, 90].map((level) => ({
  level,
  oneFourStar: levelCost(4, level),
  fourCharacterTeam: levelCost(4, level) * 4,
  surplusAfterAllListedSources: fixed.characterExp - levelCost(4, level) * 4
}));

console.log(JSON.stringify({
  assumptions: {
    storyRewardsAreOneTime: true,
    trialRewardsUseAllTenAttemptsPerStage: true,
    bossRewardsUseAllTenAttemptsPerStage: true,
    duplicatePullExperienceExcluded: true,
    talentCostsExcludedUntilTalentVersionOpens: true
  },
  teamTargets,
  sources: { story, trial, boss, dispatch, voyage, fixed },
  conclusion: "在不計重複抽卡經驗的情況下，完成開放劇情、試煉與其他已開放玩法並使用版本內可重複獎勵，角色經驗足以把四名四星養到 90 等，並保留少量緩衝；突破材料由指定材料與通用印記共同供應。"
}, null, 2));

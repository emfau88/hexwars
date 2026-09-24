import { runDoomstackCampaign } from './doomstack';

console.table(runDoomstackCampaign().map((result) => ({
  level: result.level,
  name: result.name,
  result: result.skipped ? 'locked' : result.result,
  seconds: result.seconds,
  actions: result.actions,
  captures: result.captures,
  coverage: `${result.maxMapCoverage}/${result.playableCells}`,
  frontStack: result.maxFrontStack,
  stackShare: `${Math.round(result.maxFrontStackShare * 100)}%`,
  groupActions: result.groupActions,
})));

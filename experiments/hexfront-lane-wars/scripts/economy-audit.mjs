// Design arithmetic only. This does not implement an economy in the combat lab.
const nextWave = time => Math.ceil((time - 1e-9) / 15) * 15;
const horizons = [60, 90, 120, 180, 240, 300, 420];
const strategies = [null, 120, 80].map(cost => {
  const upgradeAt = cost === null ? null : cost / 2;
  const thirdAt = cost === null ? 50 : upgradeAt + 100 / 3;
  const fourthAt = cost === null ? 100 : upgradeAt + 200 / 3;
  const productionAt = [nextWave(thirdAt), nextWave(fourthAt)];
  const milestones = horizons.map(time => {
    const earned = time * 2 + (cost === null ? 0 : Math.max(0, time - upgradeAt));
    const spent = (cost !== null && time >= upgradeAt ? cost : 0) + (time >= thirdAt ? 100 : 0) + (time >= fourthAt ? 100 : 0);
    const batches = 2 * (Math.floor(time / 15) + 1) + productionAt.reduce((sum, first) => sum + (time < first ? 0 : Math.floor((time - first) / 15) + 1), 0);
    return { time, credits: earned - spent, batches };
  });
  return { name: cost === null ? 'factories-first' : `economy-${cost}`, upgradeAt, thirdPurchase: thirdAt, fourthPurchase: fourthAt, productionAt, creditBreakEven: cost === null ? null : upgradeAt + cost, milestones };
});
console.log(JSON.stringify({ assumptions: 'Two starting factories; 2 credits/s, +1 with upgrade; 100 per extra factory; purchases as soon as affordable; no combat, refits or reinforcement purchases. Not a win-rate simulation.', strategies }, null, 2));

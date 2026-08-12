import type { FeatureFlags, LevelDefinition } from '../core/types';

const defaultFeatures: FeatureFlags = {
  all: true,
  group: true,
  relay: true,
  supply: true,
  focus: false,
};

export function defineLevel(
  level: Omit<LevelDefinition, 'cols' | 'rows' | 'features'> & {
    cols?: number;
    rows?: number;
    features?: Partial<FeatureFlags>;
  },
): LevelDefinition {
  return {
    cols: 7,
    rows: 13,
    mirrorNeutral: true,
    ...level,
    features: { ...defaultFeatures, ...level.features },
  };
}

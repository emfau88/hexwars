import type { FeatureFlags, LevelDefinition } from '../core/types';

const defaultFeatures: FeatureFlags = {
  all: true,
  group: true,
  relay: true,
  supply: true,
  focus: false,
};

export function defineLevel(
  level: Omit<LevelDefinition, 'cols' | 'rows' | 'features' | 'landscapeStyle'> & {
    cols?: number;
    rows?: number;
    features?: Partial<FeatureFlags>;
    landscapeStyle?: LevelDefinition['landscapeStyle'];
  },
): LevelDefinition {
  return {
    cols: 7,
    rows: 13,
    mirrorNeutral: true,
    landscapeStyle: 'classic',
    ...level,
    features: { ...defaultFeatures, ...level.features },
  };
}

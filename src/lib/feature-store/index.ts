// AuraFlow — Feature Store
// Schema registry + transforms for 163 diagnostic data points
// ready for scoring, ML training, and UI rendering.

export {
  FeatureRegistry,
  TOTAL_FEATURES,
  DIMENSION_SUMMARY,
  getFeaturesByDimension,
  getCriticalFeatures,
  getFeatureByScoringId,
  mapScoringToFeatureIds,
} from './registry'

export type {
  FeatureDataType,
  FeatureDimension,
  FeatureDefinition,
} from './registry'

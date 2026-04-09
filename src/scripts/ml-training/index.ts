// AuraFlow — ML Training Scripts
// Trains calibration models for Foundation Score prediction
// and gap value estimation from feature vectors.
//
// Usage: npx tsx src/scripts/ml-training/index.ts

export { trainFoundationScoreModel } from './train-foundation'
export { trainGapValueModel } from './train-gap'
export { evaluateModel } from './evaluate'

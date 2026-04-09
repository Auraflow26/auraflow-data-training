// AuraFlow — ML Data Preparation Pipeline
//
// Step 1: Extract training data from Supabase mock_datasets
//   npx tsx src/scripts/ml-prep/extract-training-data.ts
//
// Step 2: Split into train/val/test (next to build)
//   npx tsx src/scripts/ml-prep/split-datasets.ts
//
// Output directory: data/training/
//   features.jsonl   — one JSON object per dataset (163 features + labels)
//   features.csv     — tabular numeric format (categoricals hashed)
//   metadata.json    — extraction stats, schema, encoding reference

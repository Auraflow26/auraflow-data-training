#!/usr/bin/env python3
"""
AuraFlow — LoRA Fine-Tune Script for Hermes
Takes hermes-finetune-v1.jsonl → produces LoRA adapter weights.

LoRA (Low-Rank Adaptation) only trains ~1-4% of model weights.
Result: ~50MB adapter file instead of 8GB full model.

Usage:
    # From project root:
    python3 src/scripts/ml-training/lora-finetune.py

    # With options:
    python3 src/scripts/ml-training/lora-finetune.py --epochs 3 --rank 16
    python3 src/scripts/ml-training/lora-finetune.py --input ml-data/hermes-finetune-v2.jsonl
    python3 src/scripts/ml-training/lora-finetune.py --base-model mistralai/Mistral-7B-v0.1

Requirements:
    pip3 install torch transformers peft datasets bitsandbytes accelerate

Output:
    ml-data/lora-adapters/auraflow-hermes-v1/
    ├── adapter_config.json
    ├── adapter_model.safetensors    (~50MB)
    └── training_metrics.json
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime

# ─── CONFIG ────────────────────────────────────────────────────────────────────

DEFAULT_BASE_MODEL = "NousResearch/Nous-Hermes-2-Mistral-7B-DPO"
DEFAULT_INPUT      = "ml-data/hermes-finetune-v1.jsonl"
DEFAULT_OUTPUT     = "ml-data/lora-adapters/auraflow-hermes-v1"
DEFAULT_EPOCHS     = 3
DEFAULT_RANK       = 16        # LoRA rank — lower = smaller adapter, higher = more capacity
DEFAULT_ALPHA      = 32        # LoRA alpha — scaling factor
DEFAULT_LR         = 2e-4      # learning rate
DEFAULT_BATCH      = 4         # batch size (reduce if OOM)
DEFAULT_MAX_LEN    = 1024      # max sequence length

def parse_args():
    import argparse
    p = argparse.ArgumentParser(description="AuraFlow LoRA Fine-Tune for Hermes")
    p.add_argument("--input",      default=DEFAULT_INPUT,      help="Path to JSONL training data")
    p.add_argument("--output",     default=DEFAULT_OUTPUT,     help="Output directory for LoRA adapter")
    p.add_argument("--base-model", default=DEFAULT_BASE_MODEL, help="Base model to fine-tune")
    p.add_argument("--epochs",     default=DEFAULT_EPOCHS,     type=int)
    p.add_argument("--rank",       default=DEFAULT_RANK,       type=int, help="LoRA rank (8/16/32)")
    p.add_argument("--alpha",      default=DEFAULT_ALPHA,      type=int, help="LoRA alpha")
    p.add_argument("--lr",         default=DEFAULT_LR,         type=float)
    p.add_argument("--batch-size", default=DEFAULT_BATCH,      type=int)
    p.add_argument("--max-len",    default=DEFAULT_MAX_LEN,    type=int)
    p.add_argument("--quantize",   action="store_true",        help="Use 4-bit quantization (QLoRA)")
    p.add_argument("--dry-run",    action="store_true",        help="Load data and model, skip training")
    return p.parse_args()


# ─── DATA LOADING ──────────────────────────────────────────────────────────────

def load_training_data(path: str) -> list[dict]:
    """Load JSONL file produced by build-finetune-dataset.ts"""
    entries = []
    with open(path, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            entry = json.loads(line)
            entries.append({
                "prompt": entry["prompt"],
                "completion": entry["completion"],
                "weight": entry.get("metadata", {}).get("training_weight", 1.0),
            })
    return entries


def format_for_training(entries: list[dict]) -> list[dict]:
    """
    Convert prompt/completion pairs to instruction format.
    Hermes uses ChatML format:
      <|im_start|>system\n{system}<|im_end|>
      <|im_start|>user\n{prompt}<|im_end|>
      <|im_start|>assistant\n{completion}<|im_end|>
    """
    SYSTEM = (
        "You are AuraFlow's diagnostic intelligence engine. "
        "You analyze SMB business diagnostic data across 7 dimensions and generate "
        "specific, dollar-quantified executive summaries. Be direct, use exact numbers "
        "from the input, never invent data."
    )

    formatted = []
    for entry in entries:
        text = (
            f"<|im_start|>system\n{SYSTEM}<|im_end|>\n"
            f"<|im_start|>user\n{entry['prompt']}<|im_end|>\n"
            f"<|im_start|>assistant\n{entry['completion']}<|im_end|>"
        )
        formatted.append({"text": text})

    return formatted


# ─── TRAINING ──────────────────────────────────────────────────────────────────

def train(args):
    # Lazy imports — only load heavy libraries when actually training
    import torch
    from datasets import Dataset
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        TrainingArguments,
        Trainer,
        DataCollatorForLanguageModeling,
        BitsAndBytesConfig,
    )
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

    print("=" * 60)
    print("  AuraFlow — LoRA Fine-Tune")
    print("=" * 60)
    print(f"  Base model:  {args.base_model}")
    print(f"  Input:       {args.input}")
    print(f"  Output:      {args.output}")
    print(f"  LoRA rank:   {args.rank}")
    print(f"  LoRA alpha:  {args.alpha}")
    print(f"  Epochs:      {args.epochs}")
    print(f"  Batch size:  {args.batch_size}")
    print(f"  Max length:  {args.max_len}")
    print(f"  Quantized:   {'4-bit QLoRA' if args.quantize else 'No'}")
    print(f"  Device:      {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'}")
    print("=" * 60)

    # ── Load data ──────────────────────────────────────────────────────────
    print("\n📥 Loading training data...")
    raw_entries = load_training_data(args.input)
    formatted = format_for_training(raw_entries)
    print(f"   {len(formatted)} training examples loaded")

    if len(formatted) < 10:
        print("⚠️  Warning: <10 training examples. Fine-tuning may not be effective.")
        print("   Generate more data: npm run finetune")

    # ── Load tokenizer ─────────────────────────────────────────────────────
    print("\n📦 Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(args.base_model, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # ── Tokenize dataset ───────────────────────────────────────────────────
    print("🔤 Tokenizing...")
    dataset = Dataset.from_list(formatted)

    def tokenize(example):
        result = tokenizer(
            example["text"],
            truncation=True,
            max_length=args.max_len,
            padding="max_length",
        )
        result["labels"] = result["input_ids"].copy()
        return result

    tokenized = dataset.map(tokenize, remove_columns=["text"], batched=False)
    print(f"   Dataset ready: {len(tokenized)} examples, max {args.max_len} tokens")

    # ── Load model ─────────────────────────────────────────────────────────
    print(f"\n📦 Loading base model: {args.base_model}")
    print("   (this may take a few minutes on first run)")

    model_kwargs = {"trust_remote_code": True}

    if args.quantize and torch.cuda.is_available():
        # 4-bit QLoRA — uses ~4x less memory
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )
        model_kwargs["quantization_config"] = bnb_config
        model_kwargs["device_map"] = "auto"
    elif torch.cuda.is_available():
        model_kwargs["device_map"] = "auto"
        model_kwargs["torch_dtype"] = torch.float16

    model = AutoModelForCausalLM.from_pretrained(args.base_model, **model_kwargs)

    if args.quantize:
        model = prepare_model_for_kbit_training(model)

    # ── Apply LoRA ─────────────────────────────────────────────────────────
    print(f"\n🔧 Applying LoRA (rank={args.rank}, alpha={args.alpha})...")
    lora_config = LoraConfig(
        r=args.rank,
        lora_alpha=args.alpha,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],  # attention layers
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)

    trainable, total = model.get_nb_trainable_parameters()
    pct = trainable / total * 100
    print(f"   Trainable parameters: {trainable:,} / {total:,} ({pct:.2f}%)")

    if args.dry_run:
        print("\n🏁 Dry run complete. Model and data loaded successfully.")
        print(f"   Would train {args.epochs} epochs on {len(tokenized)} examples.")
        return

    # ── Training ───────────────────────────────────────────────────────────
    print(f"\n🚀 Training {args.epochs} epochs...")
    os.makedirs(args.output, exist_ok=True)

    training_args = TrainingArguments(
        output_dir=args.output,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=4,
        learning_rate=args.lr,
        warmup_ratio=0.05,
        weight_decay=0.01,
        logging_steps=10,
        save_strategy="epoch",
        fp16=torch.cuda.is_available(),
        optim="adamw_torch",
        lr_scheduler_type="cosine",
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized,
        data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
    )

    start_time = datetime.now()
    result = trainer.train()
    elapsed = (datetime.now() - start_time).total_seconds()

    # ── Save adapter ───────────────────────────────────────────────────────
    print(f"\n💾 Saving LoRA adapter to {args.output}...")
    model.save_pretrained(args.output)
    tokenizer.save_pretrained(args.output)

    # Save training metrics
    metrics = {
        "base_model": args.base_model,
        "lora_rank": args.rank,
        "lora_alpha": args.alpha,
        "epochs": args.epochs,
        "training_examples": len(tokenized),
        "trainable_parameters": trainable,
        "total_parameters": total,
        "trainable_pct": round(pct, 2),
        "training_loss": round(result.training_loss, 4),
        "training_time_seconds": round(elapsed),
        "quantized": args.quantize,
        "timestamp": datetime.now().isoformat(),
        "version": Path(args.output).name,
    }

    metrics_path = os.path.join(args.output, "training_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    adapter_size = sum(
        f.stat().st_size for f in Path(args.output).rglob("*") if f.is_file()
    ) / 1024 / 1024

    print(f"\n{'=' * 60}")
    print(f"  ✅ Fine-tuning complete!")
    print(f"  Loss:        {result.training_loss:.4f}")
    print(f"  Time:        {elapsed:.0f}s")
    print(f"  Adapter:     {adapter_size:.1f} MB")
    print(f"  Saved to:    {args.output}")
    print(f"{'=' * 60}")
    print(f"\nTo use with Ollama:")
    print(f"  1. Create Modelfile pointing to adapter")
    print(f"  2. ollama create auraflow-hermes -f Modelfile")
    print(f"  3. Update HERMES_MODEL in Railway env vars")
    print()


# ─── ENTRY POINT ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    args = parse_args()

    # Validate input file exists
    if not os.path.exists(args.input):
        print(f"❌ Training data not found: {args.input}")
        print(f"   Run first: npm run finetune")
        sys.exit(1)

    train(args)

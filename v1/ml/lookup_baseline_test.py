"""Why a learned advisor is needed when a lookup table scores 88.7 percent.

The README reports that memorising the most common outcome per suitability
label combination reaches 88.7 percent. A reviewer will ask why the instrument
trains models at all. This script answers that with numbers rather than
assertion, by measuring what the lookup table cannot do:

  1. Coverage. In cross-validation, how often does a held-out case carry a
     label combination the table never saw? Those cases have no answer at all.
  2. Accuracy split. How does the table score on covered cases versus the
     cases it has to guess on?
  3. Ties. How often is the most common outcome for a combination not unique,
     so the table's answer depends on tie-breaking rather than on evidence?

It also states the two things the table structurally cannot produce, which the
study design requires: a calibrated probability for every outcome, and a
feature attribution.

Run:  python3 v1/ml/lookup_baseline_test.py
"""

import csv
import os
import random
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data", "ils_bench_cases.csv")
FOLDS = 5
REPEATS = 3
SEED = 20260827


def load():
    rows = []
    with open(DATA, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            rows.append(
                {
                    "key": (
                        r["Consensus_Risk_Tolerance"].strip(),
                        r["Consensus_Risk_Capacity"].strip(),
                        r["Consensus_Liquidity_Need"].strip(),
                    ),
                    "outcome": (
                        "Human review"
                        if r["Consensus_Escalation"].strip().lower() == "yes"
                        else r["Consensus_Portfolio"].strip()
                    ),
                }
            )
    return rows


def folds(n, k, rng):
    idx = list(range(n))
    rng.shuffle(idx)
    return [idx[i::k] for i in range(k)]


def main():
    rows = load()
    rng = random.Random(SEED)
    majority = Counter(r["outcome"] for r in rows).most_common(1)[0]

    covered_hit = covered_n = uncovered_hit = uncovered_n = 0
    tie_cases = 0

    for _ in range(REPEATS):
        for fold in folds(len(rows), FOLDS, rng):
            test_ids = set(fold)
            train = [r for i, r in enumerate(rows) if i not in test_ids]
            test = [rows[i] for i in fold]

            table = defaultdict(Counter)
            for r in train:
                table[r["key"]][r["outcome"]] += 1

            for r in test:
                counts = table.get(r["key"])
                if not counts:
                    uncovered_n += 1
                    # With no entry the table can only fall back to the majority class.
                    uncovered_hit += r["outcome"] == majority[0]
                    continue
                covered_n += 1
                top = counts.most_common()
                if len(top) > 1 and top[0][1] == top[1][1]:
                    tie_cases += 1
                covered_hit += r["outcome"] == top[0][0]

    total = covered_n + uncovered_n
    combos = len({r["key"] for r in rows})

    print(f"cases                     {len(rows)}")
    print(f"distinct label combos     {combos}")
    print(f"majority class            {majority[0]} ({majority[1] / len(rows) * 100:.1f} percent)")
    print()
    print(f"cross-validated, {REPEATS} repeats of {FOLDS} folds, {total} predictions")
    print(f"  covered by the table    {covered_n} ({covered_n / total * 100:.1f} percent)")
    print(f"    accuracy when covered {covered_hit / covered_n * 100:.1f} percent")
    print(f"    ties in the table     {tie_cases} ({tie_cases / covered_n * 100:.1f} percent of covered)")
    print(f"  unseen combination      {uncovered_n} ({uncovered_n / total * 100:.1f} percent)")
    if uncovered_n:
        print(f"    accuracy when guessing{uncovered_hit / uncovered_n * 100:6.1f} percent")
    print(f"  overall                 {(covered_hit + uncovered_hit) / total * 100:.1f} percent")
    print()
    print("What the table cannot produce at any accuracy:")
    print("  - a calibrated probability per outcome, which the confidence condition needs")
    print("  - a feature attribution, which the why condition needs")
    print("  - an answer that varies with age, which it does not encode")


if __name__ == "__main__":
    main()

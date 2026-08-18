"""
AdviceIT by Radit, ml/train_model.py
---------------------------------------------------------------
Trains the neural-network advisor on ILS-Bench and exports its weights
to ../ml_weights.js so the browser can run inference in plain JavaScript.

Requirements:   pip install numpy         (openpyxl only for fetch_ils_bench.py)
Run:            python3 fetch_ils_bench.py   (once, downloads the dataset)
                python3 train_model.py

The dataset and the procedure it implies
----------------------------------------
ILS-Bench (Bonelli, 2026, Mendeley Data, doi:10.17632/w48mh2dtg5.1,
CC BY 4.0) contains 400 synthetic investor narratives. For each case a
panel of four independent financial-domain experts validated a set of
suitability labels and the repository provides the majority (consensus)
label for each field:

    Risk_Tolerance   Low, Moderate, High, Inconsistent
    Risk_Capacity    Low, Moderate, High
    Liquidity_Need   Low, Moderate, High, Urgent
    Portfolio        Capital preservation, Conservative, Balanced, Growth,
                     Aggressive growth, Human review
    Escalation       Yes, No   (identical to Portfolio == Human review)

The benchmark's procedure is: investor language -> structured suitability
labels -> portfolio class or escalation to a human. AdviceIT follows it.
This script learns the second step, labels -> portfolio, from the expert
consensus. In the app the labels come either from the profile form
(mapped by documented rules in model.js) or from a free-text narrative
read by the in-browser language model.

Inputs to the network (12 numbers)
    one-hot risk tolerance (4), one-hot risk capacity (3),
    one-hot liquidity need (4), standardised age (1, parsed from the
    narrative, present in all 400 cases).
Output: 6-way softmax over the portfolio classes including Human review.

A second, interpretable model
    The same script also fits a multinomial logistic regression (softmax
    regression) on the same 12 inputs and 6 outcomes. Its coefficients are
    directly readable, so its explanations are exact contributions in
    log-odds. It is the "interpretable advisor" of the app: learned from
    the same expert data as the network, but transparent. Together with
    the hand-set rule-based scorecard this gives three advisors: hand-set
    transparent, learned transparent, learned black box.

Evaluation
    5-fold stratified cross-validation, repeated with 3 seeds, reporting
    accuracy and macro-F1, next to three reference points computed from
    the same file: majority class, a lookup table of the most common
    portfolio per label combination (also cross-validated), and how
    often the dataset author's own draft label agreed with the expert
    consensus. Then the network is trained on all 400 cases and its
    probabilities are calibrated with temperature scaling on the pooled
    out-of-fold logits (Guo et al., 2017).

Everything is seeded, so re-running reproduces the same file.
"""

import csv
import json
import math
import os
import re
from collections import Counter, defaultdict
from datetime import date

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(HERE, "data", "ils_bench_cases.csv")
OUT_PATH = os.path.join(HERE, "..", "ml_weights.js")

SEED = 2026
TOLERANCE = ["Low", "Moderate", "High", "Inconsistent"]
CAPACITY = ["Low", "Moderate", "High"]
LIQUIDITY = ["Low", "Moderate", "High", "Urgent"]
CLASSES = ["Capital preservation", "Conservative", "Balanced", "Growth", "Aggressive growth", "Human review"]

HIDDEN = 16
EPOCHS = 400
BATCH = 32
LR = 0.005
WEIGHT_DECAY = 1e-3
FOLDS = 5
REPEATS = 3

AGE_PATTERNS = [
    r"\bI am (\d{2})\b", r"\b(\d{2})-year-old", r"\bI'm (\d{2})\b", r"\baged (\d{2})\b",
    r"\bage (\d{2})\b", r"\bat (\d{2})\b", r"\b(\d{2}) years old",
]


# ------------------------------------------------------------------
# 1. Load and encode
# ------------------------------------------------------------------
def parse_age(text):
    for p in AGE_PATTERNS:
        m = re.search(p, text)
        if m:
            return int(m.group(1))
    return None


def load_cases():
    if not os.path.exists(CSV_PATH):
        raise SystemExit("data/ils_bench_cases.csv not found. Run fetch_ils_bench.py first.")
    with open(CSV_PATH, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    cases = []
    for r in rows:
        age = parse_age(r["Investor_Narrative"])
        cases.append({
            "id": r["Case_ID"],
            "tolerance": r["Consensus_Risk_Tolerance"],
            "capacity": r["Consensus_Risk_Capacity"],
            "liquidity": r["Consensus_Liquidity_Need"],
            "age": age,
            "portfolio": r["Consensus_Portfolio"],
            "author": r["Author_Portfolio"],
        })
    missing = [c["id"] for c in cases if c["age"] is None]
    if missing:
        median = int(np.median([c["age"] for c in cases if c["age"] is not None]))
        for c in cases:
            if c["age"] is None:
                c["age"] = median
        print(f"age not found in {len(missing)} narratives, filled with median {median}")
    return cases


def one_hot(value, options):
    v = [0.0] * len(options)
    v[options.index(value)] = 1.0
    return v


def encode(cases, age_mean, age_std):
    X, y = [], []
    for c in cases:
        X.append(one_hot(c["tolerance"], TOLERANCE) + one_hot(c["capacity"], CAPACITY)
                 + one_hot(c["liquidity"], LIQUIDITY) + [(c["age"] - age_mean) / age_std])
        y.append(CLASSES.index(c["portfolio"]))
    return np.array(X), np.array(y)


# ------------------------------------------------------------------
# 2. Numpy MLP with Adam and L2 weight decay
# ------------------------------------------------------------------
def init_params(rng, n_in, n_out):
    def layer(a, b):
        limit = math.sqrt(6.0 / (a + b))
        return rng.uniform(-limit, limit, (a, b)), np.zeros(b)
    W1, b1 = layer(n_in, HIDDEN)
    W2, b2 = layer(HIDDEN, HIDDEN)
    W3, b3 = layer(HIDDEN, n_out)
    return [W1, b1, W2, b2, W3, b3]


def relu(z):
    return np.maximum(z, 0)


def softmax(z):
    z = z - z.max(axis=1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)


def forward(params, X):
    W1, b1, W2, b2, W3, b3 = params
    z1 = X @ W1 + b1
    a1 = relu(z1)
    z2 = a1 @ W2 + b2
    a2 = relu(z2)
    return z1, a1, z2, a2, a2 @ W3 + b3


def backward(params, cache, X, Y):
    W1, b1, W2, b2, W3, b3 = params
    z1, a1, z2, a2, logits = cache
    n = X.shape[0]
    d_logits = (softmax(logits) - Y) / n
    dW3 = a2.T @ d_logits + WEIGHT_DECAY * W3
    db3 = d_logits.sum(axis=0)
    d_z2 = (d_logits @ W3.T) * (z2 > 0)
    dW2 = a1.T @ d_z2 + WEIGHT_DECAY * W2
    db2 = d_z2.sum(axis=0)
    d_z1 = (d_z2 @ W2.T) * (z1 > 0)
    dW1 = X.T @ d_z1 + WEIGHT_DECAY * W1
    db1 = d_z1.sum(axis=0)
    return [dW1, db1, dW2, db2, dW3, db3]


def train(X, y, seed):
    rng = np.random.default_rng(seed)
    params = init_params(rng, X.shape[1], len(CLASSES))
    m = [np.zeros_like(p) for p in params]
    v = [np.zeros_like(p) for p in params]
    beta1, beta2, eps = 0.9, 0.999, 1e-8
    Y = np.eye(len(CLASSES))[y]
    step = 0
    for _ in range(EPOCHS):
        idx = rng.permutation(len(X))
        for start in range(0, len(X), BATCH):
            b = idx[start:start + BATCH]
            grads = backward(params, forward(params, X[b]), X[b], Y[b])
            step += 1
            for i in range(len(params)):
                m[i] = beta1 * m[i] + (1 - beta1) * grads[i]
                v[i] = beta2 * v[i] + (1 - beta2) * grads[i] ** 2
                params[i] = params[i] - LR * (m[i] / (1 - beta1 ** step)) / (np.sqrt(v[i] / (1 - beta2 ** step)) + eps)
    return params


def logits_of(params, X):
    return forward(params, X)[-1]


# ------------------------------------------------------------------
# 2b. Multinomial logistic regression (one linear layer, softmax).
#     Same optimiser, same weight decay, so the comparison is fair.
# ------------------------------------------------------------------
LOGIT_EPOCHS = 600
LOGIT_LR = 0.02
LOGIT_WEIGHT_DECAY = 1e-3


def train_logit(X, y, seed):
    rng = np.random.default_rng(seed)
    n_in, n_out = X.shape[1], len(CLASSES)
    Wl = rng.uniform(-0.05, 0.05, (n_in, n_out))
    bl = np.zeros(n_out)
    Y = np.eye(n_out)[y]
    mW, vW, mb, vb = np.zeros_like(Wl), np.zeros_like(Wl), np.zeros_like(bl), np.zeros_like(bl)
    beta1, beta2, eps = 0.9, 0.999, 1e-8
    step = 0
    for _ in range(LOGIT_EPOCHS):
        idx = rng.permutation(len(X))
        for start in range(0, len(X), BATCH):
            b = idx[start:start + BATCH]
            p = softmax(X[b] @ Wl + bl)
            d = (p - Y[b]) / len(b)
            gW = X[b].T @ d + LOGIT_WEIGHT_DECAY * Wl
            gb = d.sum(axis=0)
            step += 1
            mW = beta1 * mW + (1 - beta1) * gW
            vW = beta2 * vW + (1 - beta2) * gW ** 2
            mb = beta1 * mb + (1 - beta1) * gb
            vb = beta2 * vb + (1 - beta2) * gb ** 2
            Wl -= LOGIT_LR * (mW / (1 - beta1 ** step)) / (np.sqrt(vW / (1 - beta2 ** step)) + eps)
            bl -= LOGIT_LR * (mb / (1 - beta1 ** step)) / (np.sqrt(vb / (1 - beta2 ** step)) + eps)
    return Wl, bl


def logit_logits(Wl, bl, X):
    return X @ Wl + bl


# ------------------------------------------------------------------
# 3. Metrics and calibration
# ------------------------------------------------------------------
def macro_f1(y_true, y_pred):
    f1s = []
    for k in range(len(CLASSES)):
        tp = np.sum((y_pred == k) & (y_true == k))
        fp = np.sum((y_pred == k) & (y_true != k))
        fn = np.sum((y_pred != k) & (y_true == k))
        if tp + fp + fn == 0:
            continue
        p = tp / (tp + fp) if tp + fp else 0.0
        r = tp / (tp + fn) if tp + fn else 0.0
        f1s.append(2 * p * r / (p + r) if p + r else 0.0)
    return float(np.mean(f1s))


def stratified_folds(y, folds, rng):
    assignments = np.zeros(len(y), dtype=int)
    for k in np.unique(y):
        idx = np.where(y == k)[0]
        rng.shuffle(idx)
        for i, j in enumerate(idx):
            assignments[j] = i % folds
    return assignments


def nll(logits, y, T):
    p = softmax(logits / T)
    return float(-np.log(p[np.arange(len(y)), y] + 1e-12).mean())


def fit_temperature(logits, y):
    best_T, best = 1.0, nll(logits, y, 1.0)
    for T in np.arange(0.5, 3.01, 0.01):
        val = nll(logits, y, T)
        if val < best:
            best_T, best = float(T), val
    return best_T


def ece(probs, y, bins=10):
    conf = probs.max(axis=1)
    correct = (probs.argmax(axis=1) == y).astype(float)
    total = 0.0
    edges = np.linspace(0, 1, bins + 1)
    for lo, hi in zip(edges[:-1], edges[1:]):
        mask = (conf > lo) & (conf <= hi)
        if mask.any():
            total += mask.mean() * abs(correct[mask].mean() - conf[mask].mean())
    return float(total)


# ------------------------------------------------------------------
# Main
# ------------------------------------------------------------------
def main():
    cases = load_cases()
    ages = np.array([c["age"] for c in cases], dtype=float)
    age_mean, age_std = float(ages.mean()), float(ages.std())
    X, y = encode(cases, age_mean, age_std)
    n = len(y)
    print(f"ILS-Bench: {n} cases, class counts:",
          {CLASSES[k]: int(v) for k, v in zip(*np.unique(y, return_counts=True))})

    # Reference points from the file itself.
    majority = float(np.max(np.bincount(y)) / n)
    author_agree = float(np.mean([c["author"] == c["portfolio"] for c in cases]))
    print(f"majority class accuracy {majority:.3f}")
    print(f"author draft label == expert consensus {author_agree:.3f}")

    # Cross-validation: network, logistic regression and lookup table.
    accs, f1s, lookup_accs = [], [], []
    logit_accs, logit_f1s = [], []
    oof_logits = np.zeros((n, len(CLASSES)))
    oof_logit_logits = np.zeros((n, len(CLASSES)))
    for rep in range(REPEATS):
        rng = np.random.default_rng(SEED + rep)
        fold_of = stratified_folds(y, FOLDS, rng)
        for f in range(FOLDS):
            tr, te = fold_of != f, fold_of == f
            params = train(X[tr], y[tr], SEED + 100 * rep + f)
            lg = logits_of(params, X[te])
            pred = lg.argmax(axis=1)
            accs.append(float((pred == y[te]).mean()))
            f1s.append(macro_f1(y[te], pred))
            if rep == 0:
                oof_logits[te] = lg
            Wl, bl = train_logit(X[tr], y[tr], SEED + 100 * rep + f)
            llg = logit_logits(Wl, bl, X[te])
            lpred = llg.argmax(axis=1)
            logit_accs.append(float((lpred == y[te]).mean()))
            logit_f1s.append(macro_f1(y[te], lpred))
            if rep == 0:
                oof_logit_logits[te] = llg
            # lookup table baseline: most common portfolio per (tol, cap, liq) in the training fold
            table = defaultdict(Counter)
            for i in np.where(tr)[0]:
                table[(cases[i]["tolerance"], cases[i]["capacity"], cases[i]["liquidity"])][y[i]] += 1
            fallback = int(np.bincount(y[tr]).argmax())
            lp = [table[(cases[i]["tolerance"], cases[i]["capacity"], cases[i]["liquidity"])].most_common(1)[0][0]
                  if (cases[i]["tolerance"], cases[i]["capacity"], cases[i]["liquidity"]) in table else fallback
                  for i in np.where(te)[0]]
            lookup_accs.append(float((np.array(lp) == y[te]).mean()))
        print(f"repeat {rep + 1}: network CV accuracy so far {np.mean(accs):.3f}")

    cv_acc, cv_f1, lookup_acc = float(np.mean(accs)), float(np.mean(f1s)), float(np.mean(lookup_accs))
    logit_acc, logit_f1 = float(np.mean(logit_accs)), float(np.mean(logit_f1s))
    print(f"network: {FOLDS}-fold CV accuracy {cv_acc:.3f} (sd {np.std(accs):.3f}), macro-F1 {cv_f1:.3f}")
    print(f"logistic regression: CV accuracy {logit_acc:.3f} (sd {np.std(logit_accs):.3f}), macro-F1 {logit_f1:.3f}")
    print(f"lookup-table baseline CV accuracy {lookup_acc:.3f}")

    T = fit_temperature(oof_logits, y)
    ece_before = ece(softmax(oof_logits), y)
    ece_after = ece(softmax(oof_logits / T), y)
    print(f"temperature {T:.2f}, out-of-fold ECE before {ece_before:.3f}, after {ece_after:.3f}")

    # Out-of-fold confusion, for the README.
    oof_pred = oof_logits.argmax(axis=1)
    confusion = [[int(np.sum((y == i) & (oof_pred == j))) for j in range(len(CLASSES))] for i in range(len(CLASSES))]
    per_class_recall = {CLASSES[i]: round(float(confusion[i][i] / max(1, sum(confusion[i]))), 3) for i in range(len(CLASSES))}
    print("per-class recall (out of fold):", per_class_recall)

    T_logit = fit_temperature(oof_logit_logits, y)
    logit_ece_before = ece(softmax(oof_logit_logits), y)
    logit_ece_after = ece(softmax(oof_logit_logits / T_logit), y)
    print(f"logistic regression temperature {T_logit:.2f}, ECE {logit_ece_before:.3f} to {logit_ece_after:.3f}")

    # Final models on all cases.
    params = train(X, y, SEED)
    W1, b1, W2, b2, W3, b3 = params
    train_acc = float((logits_of(params, X).argmax(axis=1) == y).mean())
    print(f"final network, training-set accuracy {train_acc:.3f}")
    Wl, bl = train_logit(X, y, SEED)
    logit_train_acc = float((logit_logits(Wl, bl, X).argmax(axis=1) == y).mean())
    print(f"final logistic regression, training-set accuracy {logit_train_acc:.3f}")

    export = {
        "kind": "mlp",
        "trainedOn": "ILS-Bench v1 (Bonelli 2026, doi:10.17632/w48mh2dtg5.1, CC BY 4.0), expert consensus labels",
        "featureLayout": {
            "tolerance": TOLERANCE, "capacity": CAPACITY, "liquidity": LIQUIDITY,
            "age": {"mean": round(age_mean, 4), "std": round(age_std, 4)},
        },
        "classes": CLASSES,
        "layers": [
            {"activation": "relu", "W": W1.round(6).tolist(), "b": b1.round(6).tolist()},
            {"activation": "relu", "W": W2.round(6).tolist(), "b": b2.round(6).tolist()},
            {"activation": "linear", "W": W3.round(6).tolist(), "b": b3.round(6).tolist()},
        ],
        "temperature": round(T, 4),
        "logit": {
            "kind": "multinomial-logistic-regression",
            "W": Wl.round(6).tolist(),
            "b": bl.round(6).tolist(),
            "temperature": round(T_logit, 4),
            "meta": {
                "cvAccuracy": round(logit_acc, 4),
                "cvAccuracySd": round(float(np.std(logit_accs)), 4),
                "cvMacroF1": round(logit_f1, 4),
                "trainAccuracy": round(logit_train_acc, 4),
                "eceBefore": round(logit_ece_before, 4),
                "eceAfter": round(logit_ece_after, 4),
                "epochs": LOGIT_EPOCHS,
            },
        },
        "meta": {
            "trainedOn": date.today().isoformat(),
            "seed": SEED,
            "cases": n,
            "cvFolds": FOLDS,
            "cvRepeats": REPEATS,
            "cvAccuracy": round(cv_acc, 4),
            "cvAccuracySd": round(float(np.std(accs)), 4),
            "cvMacroF1": round(cv_f1, 4),
            "lookupBaselineAccuracy": round(lookup_acc, 4),
            "majorityBaselineAccuracy": round(majority, 4),
            "authorAgreementWithConsensus": round(author_agree, 4),
            "trainAccuracy": round(train_acc, 4),
            "eceBefore": round(ece_before, 4),
            "eceAfter": round(ece_after, 4),
            "perClassRecall": per_class_recall,
            "confusion": confusion,
            "hidden": HIDDEN,
            "epochs": EPOCHS,
            "note": "Trained on the ILS-Bench expert-consensus labels (synthetic narratives, expert-validated). Not trained on real client data.",
        },
    }
    with open(OUT_PATH, "w") as f:
        f.write("/* Generated by ml/train_model.py from ILS-Bench (Bonelli 2026, doi:10.17632/w48mh2dtg5.1, CC BY 4.0). Do not edit by hand. */\n")
        f.write("window.AdviceIT = window.AdviceIT || {};\n")
        f.write("window.AdviceIT.mlWeights = ")
        f.write(json.dumps(export, separators=(",", ":")))
        f.write(";\n")
    print("wrote", os.path.normpath(OUT_PATH))


if __name__ == "__main__":
    main()

# Asymptotic Trainer

A practice app for exam-style "asymptotic number of calls to `f`" questions — the
ETH-style format where you read a code snippet and pick its complexity class from
the 8 options: **1, n, log n, √n, n², 2ⁿ, n log n, n³**.

## Install & start

No build, no dependencies, works offline. Pick one:

```sh
git clone https://github.com/kairussenberger/asymptotic-trainer.git
cd asymptotic-trainer
open index.html          # macOS — or just double-click index.html in Finder
```

- **macOS:** double-click `start.command` (or `index.html`).
- **Anything else:** open `index.html` in any browser.

## How it works

- **Procedurally generated** — every question is a fresh randomized snippet, so you
  can practice indefinitely without memorizing answers. A class is chosen first
  (balanced across all 8 options), then a random template for that class with
  randomized constants/steps/bases that don't change the asymptotic answer.
- **Difficulty toggle** (Easy / Mixed / Hard, top-left, remembered between sessions):
  - **Easy** — the recognizable single-mechanism families (one loop → n, two nested → n², a geometric `while` → log n, …).
  - **Hard** — traps and combinations: the single-recursion-that's-actually-Θ(1), triangular and stepped loops, sequential-max (`n² + n`), and **divide-and-conquer recursion** where the intuition usually breaks — e.g. *two* recursive calls on `n // 2` is **Θ(n)**, not Θ(2ⁿ); add a linear loop and it becomes Θ(n log n) (merge-sort).
  - **Mixed** — both pools (default). All three modes still cover every one of the 8 answers.
- Click an option (or press **1–8**), hit **Check answer** (or **Enter**). Wrong
  answers show the correct option in green and a worked explanation of *why*.
- 24 generator families across all 8 classes (10 easy, 14 hard).

## Correctness

The answer for every family is **proven**, not asserted. `verify.mjs` implements a
closed-form call-count for each family *and* a brute-force simulation, then checks:

1. the closed form equals the simulation exactly for every n = 0…24, and
2. `count(n) / classFn(n)` stays in a bounded positive band as n grows (Θ).

```sh
node verify.mjs
```

The app embeds those same verified formulas, so it never teaches a wrong answer.

# Asymptotic Trainer

A practice app for exam-style "asymptotic number of calls to `f`" questions — the
ETH-style format where you read a code snippet and pick its complexity class from
the options: **1, n, log n, √n, √n log n, n², 2ⁿ, n log n, n³, n⁶**.

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
  (balanced across the available options), then a random template for that class with
  randomized constants/steps/bases that don't change the asymptotic answer.
- **Difficulty toggle** (Easy / Mixed / Hard, top-left, remembered between sessions):
  - **Easy** — the recognizable single-mechanism families (one loop → n, two nested → n², a geometric `while` → log n, …).
  - **Hard** — traps and combinations: single-recursion-that's-actually-Θ(1), triangular/stepped loops, sequential-max (`n² + n`), √n·log n, n⁶ (`range(n**2)` × `range(i**2)`), and **divide-and-conquer recursion** where intuition breaks — *two* calls on `n // 2` is **Θ(n)** (not 2ⁿ); *four* is **Θ(n²)**; add a linear loop and two calls become Θ(n log n) (merge-sort); a quadratic loop stays **Θ(n²)**.
  - **Mixed** — both pools (default). Hard & Mixed cover all 10 answer classes; Easy covers the 8 basic ones.
- Click an option (or press **1–9, 0**), hit **Check answer** (or **Enter**). Wrong
  answers show the correct option in green and a worked explanation of *why*.
- 34 generator families across 10 classes (10 easy, 24 hard).

## Correctness

The answer for every family is **proven**, not asserted. `verify.mjs` implements a
closed-form call-count for each family *and* a brute-force simulation, then checks:

1. the closed form equals the simulation exactly for every small n (n = 0…24, or
   less for the n⁶ / 2ⁿ families whose brute-force sims are expensive), and
2. `count(n) / classFn(n)` stays in a bounded positive band as n grows (Θ).

```sh
node verify.mjs
```

The app embeds those same verified formulas, so it never teaches a wrong answer.

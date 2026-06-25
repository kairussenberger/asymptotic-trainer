// verify.mjs — proves each generator family's claimed asymptotic class is correct.
// Two-layer check:
//   1. EXACTNESS: a closed-form count() must equal a brute-force loop simulation
//      for every small n (so the formula the app trusts is provably the real call count).
//   2. ASYMPTOTICS: count(n)/classFn(n) must stay in a bounded positive band as n
//      grows (the definition of Theta) — using the fast closed form, so no huge loops.
// Run: `node verify.mjs`

const CLASS = {
  one:       { label: "1",         fn: (n) => 1 },
  n:         { label: "n",         fn: (n) => n },
  logn:      { label: "log n",     fn: (n) => Math.log2(n) },
  sqrtn:     { label: "√n",        fn: (n) => Math.sqrt(n) },
  sqrtnlogn: { label: "√n log n",  fn: (n) => Math.sqrt(n) * Math.log2(n) },
  n2:        { label: "n²",        fn: (n) => n * n },
  exp:       { label: "2ⁿ",        fn: (n) => Math.pow(2, n) },
  nlogn:     { label: "n log n",   fn: (n) => n * Math.log2(n) },
  n3:        { label: "n³",        fn: (n) => n * n * n },
  n6:        { label: "n⁶",        fn: (n) => Math.pow(n, 6) },
};

// Each family: cls (claimed class), count (closed form), sim (brute-force ground truth).
const COUNTERS = {
  // Θ(1)
  const_loop: { cls: "one",
    count: (n, p = { C: 8 }) => p.C,
    sim:   (n, p = { C: 8 }) => { let c = 0; for (let i = 0; i < p.C; i++) c++; return c; } },
  const_rec: { cls: "one",
    count: (n) => 1,
    sim:   (n) => { const g = (m) => (m >= 1 ? g(m - 1) : 1); return g(n); } },

  // Θ(n)
  lin_for: { cls: "n",
    count: (n, p = { s: 1 }) => (n <= 0 ? 0 : Math.ceil(n / p.s)),
    sim:   (n, p = { s: 1 }) => { let c = 0; for (let i = 0; i < n; i += p.s) c++; return c; } },
  lin_rec: { cls: "n",
    count: (n) => Math.max(0, n),
    sim:   (n) => { let c = 0; const g = (m) => { if (m >= 1) { c++; g(m - 1); } }; g(n); return c; } },
  lin_two: { cls: "n",
    count: (n) => 2 * Math.max(0, n),
    sim:   (n) => { let c = 0; for (let i = 0; i < n; i++) c++; for (let i = 0; i < n; i++) c++; return c; } },

  // Θ(log n)
  log_mul: { cls: "logn",
    count: (n, p = { b: 2 }) => { let c = 0; for (let i = 1; i < n; i *= p.b) c++; return c; },
    sim:   (n, p = { b: 2 }) => { let c = 0; let i = 1; while (i < n) { c++; i *= p.b; } return c; } },
  log_div: { cls: "logn",
    count: (n, p = { b: 2 }) => { let c = 0; for (let i = n; i > 1; i = Math.floor(i / p.b)) c++; return c; },
    sim:   (n, p = { b: 2 }) => { let c = 0; let i = n; while (i > 1) { c++; i = Math.floor(i / p.b); } return c; } },

  // Θ(√n)
  sqrt_lt: { cls: "sqrtn",
    count: (n) => (n <= 1 ? 0 : Math.ceil(Math.sqrt(n - 1)) - 1 + (Math.ceil(Math.sqrt(n - 1)) ** 2 < n ? 1 : 0)),
    sim:   (n) => { let c = 0; for (let i = 1; i * i < n; i++) c++; return c; } },

  // Θ(n²)
  sq_full: { cls: "n2",
    count: (n) => Math.max(0, n) * Math.max(0, n),
    sim:   (n) => { let c = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c++; return c; } },
  sq_tri: { cls: "n2",
    count: (n) => (n <= 0 ? 0 : (n * (n - 1)) / 2),
    sim:   (n) => { let c = 0; for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) c++; return c; } },
  sq_step: { cls: "n2",
    count: (n) => { let c = 0; for (let i = 0; i < n; i += 2) c += i; return c; },
    sim:   (n) => { let c = 0; for (let i = 0; i < n; i += 2) for (let j = 0; j < i; j++) c++; return c; } },

  // Θ(n³)
  cube_full: { cls: "n3",
    count: (n) => Math.max(0, n) ** 3,
    sim:   (n) => { let c = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) c++; return c; } },
  cube_tri: { cls: "n3",
    count: (n) => { let c = 0; for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) c += j; return c; },
    sim:   (n) => { let c = 0; for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) for (let k = 0; k < j; k++) c++; return c; } },

  // Θ(n log n)
  nlogn_a: { cls: "nlogn",
    count: (n) => { let inner = 0; for (let j = 1; j < n; j *= 2) inner++; return Math.max(0, n) * inner; },
    sim:   (n) => { let c = 0; for (let i = 0; i < n; i++) for (let j = 1; j < n; j *= 2) c++; return c; } },
  nlogn_b: { cls: "nlogn",
    count: (n) => { let outer = 0; for (let i = 1; i < n; i *= 2) outer++; return outer * Math.max(0, n); },
    sim:   (n) => { let c = 0; for (let i = 1; i < n; i *= 2) for (let j = 0; j < n; j++) c++; return c; } },

  // Θ(2ⁿ)
  exp_leaves: { cls: "exp",
    count: (n) => Math.pow(2, Math.max(0, n)),
    sim:   (n) => { const g = (m) => (m <= 0 ? 1 : g(m - 1) + g(m - 1)); return g(n); } },
  exp_nodes: { cls: "exp",
    count: (n) => Math.pow(2, Math.max(0, n) + 1) - 1,
    sim:   (n) => { let c = 0; const g = (m) => { c++; if (m >= 1) { g(m - 1); g(m - 1); } }; g(n); return c; } },

  // ---- HARD families (traps & divide-and-conquer recursion) ----

  // Θ(log n) — halving recursion, constant work per call
  rec_half: { cls: "logn",
    count: (n) => { let c = 0, m = n; while (m >= 1) { c++; m = Math.floor(m / 2); } return c; },
    sim:   (n) => { let c = 0; const g = (m) => { if (m >= 1) { c++; g(Math.floor(m / 2)); } }; g(n); return c; } },

  // Θ(n) — TWO recursive calls but on n//2 (looks exponential, is linear)
  rec_bin_half: { cls: "n",
    count: (() => { const memo = new Map(); const C = (m) => { if (m < 1) return 0; if (memo.has(m)) return memo.get(m); const v = 1 + 2 * C(Math.floor(m / 2)); memo.set(m, v); return v; }; return (n) => C(n); })(),
    sim:   (n) => { let c = 0; const g = (m) => { if (m >= 1) { c++; g(Math.floor(m / 2)); g(Math.floor(m / 2)); } }; g(n); return c; } },

  // Θ(n²) — single recursion with a LINEAR loop per call: n + (n-1) + ... = n(n+1)/2
  rec_loop_lin: { cls: "n2",
    count: (n) => (n <= 0 ? 0 : (n * (n + 1)) / 2),
    sim:   (n) => { let c = 0; const g = (m) => { if (m >= 1) { for (let i = 0; i < m; i++) c++; g(m - 1); } }; g(n); return c; } },

  // Θ(n²) — quadratic block followed by a linear block (take the max term)
  seq_max: { cls: "n2",
    count: (n) => (n <= 0 ? 0 : n * n + n),
    sim:   (n) => { let c = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c++; for (let k = 0; k < n; k++) c++; return c; } },

  // Θ(n log n) — TWO recursive calls on n//2 with a LINEAR loop per call (merge-sort recurrence)
  rec_bin_half_lin: { cls: "nlogn",
    count: (() => { const memo = new Map(); const C = (m) => { if (m < 1) return 0; if (memo.has(m)) return memo.get(m); const v = m + 2 * C(Math.floor(m / 2)); memo.set(m, v); return v; }; return (n) => C(n); })(),
    sim:   (n) => { let c = 0; const g = (m) => { if (m >= 1) { for (let i = 0; i < m; i++) c++; g(Math.floor(m / 2)); g(Math.floor(m / 2)); } }; g(n); return c; } },

  // Θ(√n) — loop bounded by an accumulator k = i² (the √n is less obvious)
  sqrt_acc: { cls: "sqrtn",
    count: (n) => { let c = 0, i = 1, k = 1; while (k < n) { c++; i++; k = i * i; } return c; },
    sim:   (n) => { let c = 0, i = 1, k = 1; while (k < n) { c++; i++; k = i * i; } return c; } },

  // Θ(√n) — triangular accumulator s = 1+2+...+i reaches n when i ≈ √(2n)
  sqrt_tri: { cls: "sqrtn",
    count: (n) => { let c = 0, i = 0, s = 0; while (s < n) { c++; i++; s += i; } return c; },
    sim:   (n) => { let c = 0, i = 0, s = 0; while (s < n) { c++; i++; s += i; } return c; } },

  // ---- families from the new exam screenshots ----

  // Θ(√n log n) — outer √n loop (i*i<n) nesting an inner halving loop (log n)
  sqrt_log: { cls: "sqrtnlogn",
    count: (n) => { let c = 0; for (let i = 1; i * i < n; i++) { let j = n; while (j > 1) { c++; j = Math.floor(j / 2); } } return c; },
    sim:   (n) => { let c = 0, i = 1; while (i * i < n) { let j = n; while (j > 1) { c++; j = Math.floor(j / 2); } i++; } return c; } },
  // Θ(√n log n) — outer √n loop nesting an inner doubling loop (log n)
  sqrt_log2: { cls: "sqrtnlogn",
    count: (n) => { let c = 0; for (let i = 1; i * i < n; i++) { for (let j = 1; j < n; j *= 2) c++; } return c; },
    sim:   (n) => { let c = 0, i = 1; while (i * i < n) { let j = 1; while (j < n) { c++; j *= 2; } i++; } return c; } },

  // Θ(n⁶) — for i in range(n²): for j in range(i²)  -> Σ_{i<n²} i²  (sum of squares of m=n² terms)
  n6_tri: { cls: "n6", maxN: 8,
    count: (n) => { const m = n * n; return m <= 0 ? 0 : ((m - 1) * m * (2 * m - 1)) / 6; },
    sim:   (n) => { let c = 0; const m = n * n; for (let i = 0; i < m; i++) for (let j = 0; j < i * i; j++) c++; return c; } },
  // Θ(n⁶) — two nested loops each running n³ times -> (n³)·(n³)
  n6_full: { cls: "n6", maxN: 8,
    count: (n) => Math.pow(Math.max(0, n), 6),
    sim:   (n) => { let c = 0; const m = n * n * n; for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) c++; return c; } },

  // Θ(n log n) — geometric (halving) outer loop, linear inner loop
  nlogn_c: { cls: "nlogn",
    count: (n) => { let outer = 0; for (let i = n; i > 1; i = Math.floor(i / 2)) outer++; return outer * Math.max(0, n); },
    sim:   (n) => { let c = 0, i = n; while (i > 1) { for (let j = 0; j < n; j++) c++; i = Math.floor(i / 2); } return c; } },

  // Θ(n) — geometric outer loop with i-sized inner work: 1+2+4+...+~n ≈ 2n (trap: looks like n log n)
  lin_geomwork: { cls: "n",
    count: (n) => { let c = 0; for (let i = 1; i < n; i *= 2) c += i; return c; },
    sim:   (n) => { let c = 0, i = 1; while (i < n) { for (let j = 0; j < i; j++) c++; i *= 2; } return c; } },

  // Θ(n²) — f() then FOUR recursive calls on n//2  (a=4, b=2  ->  n^log2(4) = n²)
  rec_quad_half: { cls: "n2",
    count: (() => { const memo = new Map(); const C = (m) => { if (m < 0) return 0; if (memo.has(m)) return memo.get(m); const v = 1 + (m > 1 ? 4 * C(Math.floor(m / 2)) : 0); memo.set(m, v); return v; }; return (n) => C(n); })(),
    sim:   (n) => { let c = 0; const g = (m) => { c++; if (m > 1) { g(Math.floor(m / 2)); g(Math.floor(m / 2)); g(Math.floor(m / 2)); g(Math.floor(m / 2)); } }; g(n); return c; } },

  // Θ(n²) — n² work per call + two recursive calls on n//2 (work at the top dominates: 2T(n/2)+n²)
  rec_work_dominates: { cls: "n2",
    count: (() => { const memo = new Map(); const C = (m) => { if (m < 1) return 0; if (memo.has(m)) return memo.get(m); const v = m * m + (m > 1 ? 2 * C(Math.floor(m / 2)) : 0); memo.set(m, v); return v; }; return (n) => C(n); })(),
    sim:   (n) => { let c = 0; const g = (m) => { for (let i = 0; i < m * m; i++) c++; if (m > 1) { g(Math.floor(m / 2)); g(Math.floor(m / 2)); } }; g(n); return c; } },

  // Θ(2ⁿ) — linear loop per call + two recursive calls on n-1 (the loop doesn't change exponential)
  exp_work: { cls: "exp", maxN: 18,
    count: (() => { const memo = new Map(); const C = (m) => { if (m < 0) return 0; if (memo.has(m)) return memo.get(m); const v = Math.max(0, m) + (m >= 1 ? 2 * C(m - 1) : 0); memo.set(m, v); return v; }; return (n) => C(n); })(),
    sim:   (n) => { let c = 0; const g = (m) => { for (let i = 0; i < m; i++) c++; if (m >= 1) { g(m - 1); g(m - 1); } }; g(n); return c; } },
};

// ---- Layer 1: closed form must equal brute-force sim for all small n ----
let exactFail = 0;
for (const [name, ctr] of Object.entries(COUNTERS)) {
  const maxN = ctr.maxN ?? 24; // heavy families (n⁶, 2ⁿ) cap the brute-force sim range
  for (let n = 0; n <= maxN; n++) {
    const a = ctr.count(n), b = ctr.sim(n);
    if (a !== b) { console.log(`EXACT FAIL ${name} n=${n}: count=${a} sim=${b}`); exactFail++; }
  }
}
console.log(exactFail === 0 ? "✓ exactness: all closed forms match brute-force sim (n=0..maxN per family)" : `✗ exactness: ${exactFail} mismatches`);

// ---- Layer 2: Theta band check using the (fast) closed form ----
function thetaOk(ctr) {
  const fn = CLASS[ctr.cls].fn;
  const ns = ctr.cls === "exp" ? [6, 8, 10, 12, 14, 16, 18] : [64, 100, 1000, 4096, 16384, 65536];
  const ratios = [];
  for (const n of ns) {
    const denom = fn(n);
    if (denom === 0) continue;
    ratios.push(ctr.count(n) / denom);
  }
  const lo = Math.min(...ratios), hi = Math.max(...ratios);
  return { ok: lo > 1e-9 && hi / lo < 4 && Number.isFinite(hi), lo, hi, spread: hi / lo };
}

console.log("\nfamily".padEnd(13), "claim".padEnd(8), "ok    spread  ratio band");
console.log("-".repeat(62));
let pass = 0, fail = 0;
for (const [name, ctr] of Object.entries(COUNTERS)) {
  const r = thetaOk(ctr);
  if (r.ok) pass++; else fail++;
  console.log(name.padEnd(12), CLASS[ctr.cls].label.padEnd(8), (r.ok ? "PASS" : "FAIL").padEnd(5),
    r.spread.toFixed(3).padStart(6), `  [${r.lo.toExponential(2)} .. ${r.hi.toExponential(2)}]`);
}
console.log("-".repeat(62));
console.log(`${pass} passed, ${fail} failed`);

// ---- separation: representative of each class out-grows the one below ----
const repr = { one: "const_loop", logn: "log_mul", sqrtn: "sqrt_lt", sqrtnlogn: "sqrt_log", n: "lin_for", nlogn: "nlogn_a", n2: "sq_full", n3: "cube_full", n6: "n6_full" };
let prev = -1, sepOk = true;
console.log("\nseparation @ n=65536:");
for (const cls of ["one", "logn", "sqrtn", "sqrtnlogn", "n", "nlogn", "n2", "n3", "n6"]) {
  const v = COUNTERS[repr[cls]].count(65536);
  const ok = v > prev; if (!ok) sepOk = false;
  console.log(`  ${CLASS[cls].label.padEnd(8)} -> ${v.toExponential(3)} ${ok ? "✓" : "✗"}`);
  prev = v;
}
console.log(sepOk ? "✓ separation OK" : "✗ separation FAILED");

process.exit(exactFail === 0 && fail === 0 && sepOk ? 0 : 1);

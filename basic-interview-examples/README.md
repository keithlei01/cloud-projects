# Meta Business Engineer — IC5 Interview Prep

Practical coding questions tailored for **Meta Business Engineer** interviews: metrics, funnels, revenue, experiments, and data manipulation—not pure algorithms for their own sake.

## How to use this repo

1. Read `problem.md` without looking at the solution.
2. Implement in JavaScript (or your interview language).
3. Compare with `solution.js` and read `explanation.md` for trade-offs and follow-ups.
4. Practice explaining **business impact** and **edge cases** out loud (common at IC5).

## Structure

| Level  | Focus | Questions |
|--------|--------|-----------|
| [warmup](./warmup/) | JS muscle memory (start here if rusty) | 10 |
| [easy](./easy/) | Parsing, aggregation, KPIs, ads metrics, classic LC, merge | 18 |
| [medium](./medium/) | Windows, cohorts, experiments, budgets, heaps, classic LC | 15 |
| [hard](./hard/) | Streams, attribution, scheduling, multi-step metrics | 5 |

Each question folder contains:

- `problem.md` — **start here** (prompt only)
- `attempt.js` — starter stub with edge-case tests (fill in TODO, run with Node)
- `solution.js` — classic reference (check after your attempt)
- `solution-modern.js` — modern JS style (warmup only)
- `explanation.md` — approach, constraints, edge cases, complexity, IC5 talking points

Every problem folder includes `attempt.js` with inline tests covering constraints and edge cases from `problem.md`.

## What interviewers often probe (IC5)

- Correctness on messy real-world input (empty days, ties, time zones mentioned verbally).
- Time/space complexity when data grows (logs, streams).
- How you’d productionize: validation, idempotency, monitoring.
- Connecting code to **decisions** (ship feature? pause campaign?).

## Suggested study order

**Days 1–3:** [warmup](./warmup/) (all 10)  
**Week 1:** All easy → medium 01–03  
**Week 2:** Medium 04–08 → hard 01–03  
**Week 3:** Hard 04–05 + timed mocks (45 min / 2 problems)

Good luck.

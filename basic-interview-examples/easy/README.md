# Easy — Business Eng Fundamentals

| # | Topic | Skills |
|---|--------|--------|
| [01-daily-active-users](./01-daily-active-users/) | DAU from event logs | Hash map, sets, date handling |
| [02-revenue-by-region](./02-revenue-by-region/) | Parse & aggregate revenue | Defensive parsing, cents |
| [03-coupon-validation](./03-coupon-validation/) | Promo rules | Branching business logic |
| [04-funnel-conversion-rate](./04-funnel-conversion-rate/) | Step conversion | Funnel definitions |
| [05-top-products-by-units](./05-top-products-by-units/) | Top K catalog | Aggregation, sorting |
| [06-ad-spend-by-campaign](./06-ad-spend-by-campaign/) | Campaign spend rollup | Map, cents, sort |
| [07-click-through-rate-by-ad](./07-click-through-rate-by-ad/) | Ad CTR | Event counts, ratio |
| [08-cpa-by-campaign](./08-cpa-by-campaign/) | Cost per acquisition | Mixed events, dual maps |
| [09-reach-and-frequency](./09-reach-and-frequency/) | Reach & frequency | Set dedupe + ratio |
| [10-roas-by-campaign](./10-roas-by-campaign/) | Return on ad spend | Dual sum, omit zero spend |
| [11-cpc-by-campaign](./11-cpc-by-campaign/) | Cost per click | Mixed events (like CPA) |
| [12-campaign-budget-utilization](./12-campaign-budget-utilization/) | Budget pacing % | External budget map |
| [13-effective-cpm-by-campaign](./13-effective-cpm-by-campaign/) | Effective CPM | Ratio × 1000 |
| [14-two-sum-reconciliation](./14-two-sum-reconciliation/) | Two-sum pair matching | **LC #1** — hash map |
| [15-top-k-frequent-errors](./15-top-k-frequent-errors/) | Top K error codes | **LC #347** — frequency |
| [16-merge-sorted-array-in-place](./16-merge-sorted-array-in-place/) | Merge into buffer | **LC #88** — interview Q |
| [17-merge-two-sorted-logs](./17-merge-two-sorted-logs/) | Merge two sorted | LC #88 variant |
| [18-remove-duplicates-sorted-ids](./18-remove-duplicates-sorted-ids/) | Dedupe sorted IDs | **LC #26** — two pointers |

**Target time:** 20–30 min each (08–13 slightly longer; 14–18 ~20 min).

## Ads metrics ladder (06–13)

Spend → CTR → CPA → Reach/Frequency → ROAS → CPC → Budget % → eCPM

## Popular LeetCode (non-ads)

14 Two Sum → 15 Top K Frequent

## Merge / two pointers (interview merge Q)

16 LC #88 in place → 17 merge new array → 18 LC #26 dedupe

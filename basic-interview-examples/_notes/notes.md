# JS

basic
- use const or let, avoid var
  - const for [], Map, Set, object {} - can modify contents but no reassign e.g. arr[0] = 1 - OK, arr = [] - failed
    - result = result.filter(...) will reassign, use let instead of const
  - let - block scope
  - var - function scope

array
- arr.length instead of arr.size

Interview usefulness (for your prep)
 | Method | How often | Typical use in your repo | 
 | - | - | - | 
 | filter | ⭐⭐⭐ Very common | Keep rows where value >= min, valid lines | 
 | reduce | ⭐⭐⭐ Very common | Sum, count frequencies, group/aggregate | 
 | map | ⭐⭐⭐ Very common | Transform output shape (not covered yet but same tier) | 
 | every | ⭐⭐ Common | Phrase keyword: ALL parts must be in the token set | 
 | slice | ⭐⭐ Common | Top-k: sorted.slice(0, k) | 
 | splice | ⭐ Rare | In-place remove/insert — almost never in metrics problems | 

Most interview code looks like:
```javascript
// filter — keep what matches
const valid = lines.filter(line => parseLine(line) !== null);

// reduce — sum or count
const sum = nums.reduce((acc, n) => acc + n, 0);

// map - transform map entries to objects: map(region, cents) => { region: region, revenue: dollars }
const result = [...centsByRegion.entries()].map(([region, cents]) => ({
    region,
    revenue: roundDollars(cents / 100),
  }));

// map - split
const [name, age, city] = line.split(",").map((part) => part.trim());

// splice - arr.splice(1, 2, "x", "y", "z");
// ["a", "b", "c", "d"] => // ["a", "d", "x", "y", "z"] and returns ["b", "c"]
const removed = arr.splice(start, deleteCount, ...itemsToInsert);

// every — true only if ALL items pass (AND). Empty array → true.
const phraseHits = parts.length > 0 && parts.every((p) => tokens.has(p));
// "where is" needs both where AND is in the message Set
// NOT the same as count: filter((t) => doc.includes(t)).length  // how MANY match (RAG score)
```

string — match
- str.match(regex) — search string with a regex
- with `g`: array of all matching substrings, or **null** if none (use `|| []`)
- without `g`: first match + capture groups, or null
```javascript
"Where is my shipping?".toLowerCase().match(/[a-z0-9]+/g);
// ["where", "is", "my", "shipping"]  — tokenizer (letters/digits runs)

"???".match(/[a-z0-9]+/g);       // null
"???".match(/[a-z0-9]+/g) || []; // []

"id=42".match(/id=(\d+)/);
// ["id=42", "42"]  — [0] full match, [1] first group
```

More examples
- reduce - fold array into one value
  - arr.reduce((sum, n) => sum + n, 0);
  - arr.reduce((max, n) => (n > max? n : max), arr[0]);
  - items.reduce((counts, item) => {  
  counts[item] = (counts[item] || 0) + 1;  
  return counts;  
  }, {});

for 
- for (const x in items) - mainly object keys and array indices (rarely)
  - const counts = { US: 3, EU: 1 };
  for (const key in counts) console.log(key, counts[key]);  // ✅
  for (const val of counts) ...  // ❌ objects aren't iterable with for...of
- for (const x of items) - arrays, strings, map, set
  - const items = ["US", "EU"];
  for (const x of items) console.log(x);  // "US", "EU"     ✅
  for (const x in items) console.log(x);  // "0", "1"       ❌ for arrays

data conversions
| Conversion           | Code                          |
| -------------------- | ----------------------------- |
| {} → Map             | new Map(Object.entries(obj))  |
| Map → {}             | Object.fromEntries(map)       |
| Map → array of pairs | [...map] or Array.from(map)   |
| array of pairs → Map | new Map([["a", 1], ["b", 2]]) |



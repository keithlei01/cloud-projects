# Currency Conversion

## Problem Description

Given a string representing currency conversion rates, write a function to determine the exchange rate between two currencies.

### Input Format
A string containing comma-separated conversion rates in the format: `"FROM:TO:RATE,FROM:TO:RATE,..."`

### Example
```
"AUD:USD:0.7,AUD:JPY:100,USD:CAD:1.2"
```

### Requirements

1. **Basic Function**: Write a function that takes the conversion string and two currency codes, returning the direct exchange rate if available.

2. **Indirect Conversion**: Handle cases where you need to convert through intermediate currencies (e.g., AUD → USD → CAD).

3. **Best Rate Calculation**: When multiple conversion paths exist, calculate and return the best (most favorable) exchange rate.

4. **Error Handling**: Handle cases where conversion is not possible.

### Examples

```python
# Direct conversion
get_exchange_rate("AUD:USD:0.7,AUD:JPY:100,USD:CAD:1.2", "AUD", "USD")
# Returns: 0.7

# Indirect conversion
get_exchange_rate("AUD:USD:0.7,AUD:JPY:100,USD:CAD:1.2", "AUD", "CAD")
# Returns: 0.84 (0.7 * 1.2)

# Multiple paths - return best rate
get_exchange_rate("AUD:USD:0.7,USD:EUR:0.8,AUD:EUR:0.6", "AUD", "EUR")
# Returns: 0.6 (direct rate is better than 0.7 * 0.8 = 0.56)
```

### Extensions

1. **Bidirectional Rates**: Handle reverse conversions (if AUD:USD:0.7 exists, USD:AUD should be 1/0.7).

2. **Rate Updates**: Implement a system to update existing rates and recalculate affected conversions.

3. **Rate History**: Track rate changes over time and allow queries for historical rates.

### Evaluation Criteria

- Correctness of conversion logic
- Handling of edge cases
- Code clarity and structure
- Performance considerations for large rate sets
- Error handling and validation

### Time Complexity
- Basic: O(1) for direct lookups
- Advanced: O(V + E) where V is currencies and E is conversion pairs

### Space Complexity
- O(V + E) for storing the conversion graph

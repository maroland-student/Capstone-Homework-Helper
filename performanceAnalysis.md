# Research Document: Data Analytics Algorithms for Student Performance Analysis

**Date:** October 24, 2025

## Abstract

This research identifies data analytics algorithms for processing student homework data and generating automated performance reports. The system uses five core algorithms: aggregation, classification, ranking, filtering, and natural language generation to transform raw assignment data into actionable insights for educators and parents.

### Data Aggregation

**Purpose:** Group questions by topic and calculate performance statistics.

**Algorithm:**

```
FOR each question:
    Group by topic
    Count correct/incorrect
    Calculate accuracy = (correct / total) × 100
```

**Example:**

```
Input: Q1-Fractions-Correct, Q2-Fractions-Incorrect, Q3-Fractions-Correct
Output: Fractions: 2/3 = 67%
```

**Complexity:** O(n) where n = number of questions

### Classification

**Purpose:** Categorize performance levels.

**Rules:**

```
IF accuracy ≥ 90% THEN "Excellent - Mastered"
ELSE IF accuracy ≥ 75% THEN "Good - Proficient"
ELSE IF accuracy ≥ 60% THEN "Fair - Developing"
ELSE "Needs Support"
```

**Justification:** Thresholds align with standard educational grading systems (90-80-70-60 scale).

**Complexity:** O(t) where t = number of topics

### Ranking

**Purpose:** Prioritize topics by performance.

**Algorithm:** Sort topics by accuracy (ascending = lowest first)

**Example:**

```
Before: Algebra 75%, Fractions 67%, Decimals 100%
After: Fractions 67%, Algebra 75%, Decimals 100%
```

**Complexity:** O(t log t)

### Filtering

**Purpose:** Identify key insights.

**Rules:**

```
Strengths = topics WHERE accuracy ≥ 85%
Concerns = topics WHERE accuracy < 70%
```

**Example:**

```
All topics: Fractions 67%, Decimals 88%, Algebra 92%
Strengths: Decimals (88%), Algebra (92%)
Concerns: Fractions (67%)
```

**Complexity:** O(t)

### Natural Language Generation

**Purpose:** Convert data to readable text.

**Template:**

```
Dear [Recipient],

[Student] completed [Assignment] with [Overall %]%.

Strong Areas:
- [Topic]: [%] - [Message]

Areas for Growth:
- [Topic]: [%] - [Recommendation]

Recommendation: [Action items]
```

**Complexity:** O(t)

## Complete System Pipeline

```
INPUT (Raw Data)
    ↓
AGGREGATE (Group by topic, calculate %) → O(n)
    ↓
CLASSIFY (Assign performance levels) → O(t)
    ↓
RANK (Sort by priority) → O(t log t)
    ↓
FILTER (Find strengths/concerns) → O(t)
    ↓
GENERATE (Create report text) → O(t)
    ↓
OUTPUT (Email Report)
```

**Overall Complexity:** O(n + t log t)

Since t (topics) is typically much smaller than n (questions), and in practice t log t ≈ t for small t, the system effectively runs in **O(n)** linear time.

## Case Study Example

**Input:**

- Student: Emma Johnson
- Assignment: Week 3 Math
- Questions: Algebra 3/4, Geometry 2/3, Statistics 2/3

**Processing:**

1. **Aggregate:** Algebra 75%, Geometry 67%, Statistics 67%
2. **Classify:** Algebra "Good", Geometry "Fair", Statistics "Fair"
3. **Rank:** Geometry (67%), Statistics (67%), Algebra (75%)
4. **Filter:** Concerns = Geometry, Statistics
5. **Generate:**

```
Dear Parent and Teacher,

Emma Johnson completed Week 3 Math with 70% overall.

Strong Areas:
- Algebra: 75% - Good proficiency shown

Areas for Growth:
- Geometry: 67% - Additional practice recommended
- Statistics: 67% - Additional practice recommended

Recommendation: Focus on geometry and statistics.
```

## Technical Specifications

### Data Structures

**Question:**

```javascript
{ id: 1, topic: "Fractions", correct: true }
```

**Topic Statistics:**

```javascript
{ topic: "Fractions", correct: 2, total: 3, accuracy: 67 }
```

### Complexity Summary

| Algorithm      | Time                      | Space        |
| -------------- | ------------------------- | ------------ |
| Aggregation    | O(n)                      | O(t)         |
| Classification | O(t)                      | O(1)         |
| Ranking        | O(t log t)                | O(t)         |
| Filtering      | O(t)                      | O(t)         |
| Generation     | O(t)                      | O(1)         |
| **Total**      | **O(n + t log t) ≈ O(n)** | **O(n + t)** |

## Testing

### Test Cases

1. **All Correct:** Verify 100% and "Excellent" classification
2. **All Incorrect:** Verify 0% and "Needs Support" classification
3. **Mixed Performance:** Verify correct grouping and ranking
4. **Boundary Values:** Test 74.9%, 75.0%, 75.1% classifications
5. **Edge Cases:** Single topic, ties in ranking

### Strengths

- Transparent and explainable algorithms
- Efficient O(n) performance for real-time use
- Aligns with educational standards
- Scalable to multiple students

### Limitations

- Only tracks correct/incorrect (no partial credit)
- Static thresholds (doesn't account for difficulty)
- Template-based text (limited sophistication)

### Future Work

- Add weighted scoring for question difficulty
- Implement predictive analytics for trends
- Enhance natural language generation

## Conclusion

This research establishes an algorithmic framework for automated homework analysis using five core algorithms. The system achieves **O(n) linear time complexity**, making it suitable for real-time processing in educational settings.

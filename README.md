# Zomato Bangalore Market Analysis — Full Project Documentation

**Tools:** SQL Server (SSMS 22), Power BI Desktop
**Dataset:** Zomato Bangalore Restaurants (Kaggle) — 51,717 raw listings
**Goal:** Analyze the Bangalore restaurant market to help a business owner decide *where* to open, *what cuisine* to serve, and *what price point* to target.

---

## 1. Setup

- Created database `ZomatoDB` in SQL Server Express via SSMS.
- Imported `zomato.csv` using SSMS's **Import Flat File** wizard into a table called `restaurants`.
- Widened `url`, `address`, `name`, `cuisines`, `dish_liked` columns to `nvarchar(max)` to avoid truncation errors during import.
- **Result:** 51,717 rows imported successfully.

---

## 2. Data Cleaning

### 2.1 Explored raw data quality

```sql
SELECT DISTINCT [rate] FROM restaurants;
SELECT DISTINCT [approx_cost(for two people)] FROM restaurants;
SELECT [name], COUNT(*) AS cnt FROM restaurants GROUP BY [name] ORDER BY cnt DESC;
SELECT COUNT(*) AS null_ratings FROM restaurants WHERE [rate] IS NULL OR [rate] = '';
```

**Findings:**
- `rate` stored as text like `"4.1/5"`, `"NEW"`, `"-"`, or blank.
- `approx_cost_for_two_people` had commas as text in raw form (SSMS's wizard auto-converted this one to `float` on import).
- **10,052 rows (19.4%)** had no valid rating.
- **346 rows (0.7%)** had no cost data.
- `votes` was imported as `nvarchar` (text) — caused incorrect string-based sorting later.

### 2.2 Cleaned the `rate` column

```sql
ALTER TABLE restaurants ADD rate_clean FLOAT;
GO
UPDATE restaurants
SET rate_clean = 
    CASE 
        WHEN [rate] IS NULL OR [rate] = '' OR [rate] = 'NEW' OR [rate] = '-' THEN NULL
        ELSE TRY_CAST(LEFT([rate], CHARINDEX('/', [rate]) - 1) AS FLOAT)
    END;
GO
```
**Result:** 10,052 NULLs confirmed matching the original count — cleaning validated.

### 2.3 Cleaned the `votes` column (fixed a text-sort bug)

```sql
ALTER TABLE restaurants ADD votes_clean INT;
GO
UPDATE restaurants
SET votes_clean = TRY_CAST([votes] AS INT);
GO
```
**Why:** `votes` was text, so `ORDER BY votes DESC` sorted alphabetically (e.g., "9300" appeared between "935" and "926"). This is a common real-world data-type gotcha.

### 2.4 Deduplicated to unique restaurants

The raw dataset has **one row per restaurant per Zomato listing category** (Delivery, Dine-out, Cafes, Buffet, etc.), so the same restaurant appears multiple times.

```sql
SELECT 
    [name], [location],
    MAX(rate_clean) AS rate_clean,
    MAX(votes_clean) AS votes_clean,
    MAX(approx_cost_for_two_people) AS approx_cost_for_two_people,
    MAX([cuisines]) AS cuisines,
    MAX([online_order]) AS online_order,
    MAX([book_table]) AS book_table,
    MAX([rest_type]) AS rest_type
INTO restaurants_unique
FROM restaurants
GROUP BY [name], [location];
```
**Result: 51,717 raw listings → 12,137 unique restaurants** (each restaurant averaged ~4.3 listings across categories). All analysis from this point uses `restaurants_unique`.

---

## 3. Core Analytical Queries & Results

### Query 1 — Restaurant density by locality
```sql
SELECT [location], COUNT(*) AS restaurant_count
FROM restaurants
GROUP BY [location]
ORDER BY restaurant_count DESC;
```
**Result (top 10):** BTM (5,124), HSR (2,523), Koramangala 5th Block (2,504), JP Nagar (2,235), Whitefield (2,144), Indiranagar (2,083), Jayanagar (1,926), Marathahalli (1,846), Bannerghatta Road (1,630), Bellandur (1,286).
**Insight:** BTM alone accounts for ~10% of all restaurant listings — nearly 2x the next-highest locality.

### Query 2 — Average rating by cuisine combination
```sql
SELECT [cuisines], AVG(rate_clean) AS avg_rating, COUNT(*) AS cnt
FROM restaurants
WHERE rate_clean IS NOT NULL
GROUP BY [cuisines]
HAVING COUNT(*) > 20
ORDER BY avg_rating DESC;
```
**Result:** Niche/fusion cafes (Thai-Japanese-Continental, artisanal Italian) top the list at 4.3–4.7★. Mass-market cuisines score lower: North Indian (2,158 rated restaurants, 3.59★), Biryani (609 rated, 3.44★), Fast Food (517 rated, 3.48★).
**Insight:** Inverse relationship between cuisine popularity and rating — high-volume categories are commoditized.

### Query 3 — Top 10 most common cuisines
```sql
SELECT TOP 10 [cuisines], COUNT(*) AS cnt
FROM restaurants
GROUP BY [cuisines]
ORDER BY cnt DESC;
```
**Result:** North Indian (2,913), North Indian+Chinese (2,385), South Indian (1,828), Biryani (918), Bakery+Desserts (911), Fast Food (803), Desserts (766), Cafe (756), South Indian+North Indian+Chinese (726), Bakery (651).

### Query 4 — High-rated, high-vote restaurants (corrected after votes fix)
```sql
SELECT [name], [location], rate_clean, votes_clean
FROM restaurants
WHERE rate_clean > 4.0 AND votes_clean > 500
ORDER BY votes_clean DESC;
```
**Result:** Byg Brewski Brewing Company (Sarjapur Road) leads with 4.9★ and 16,832 votes. Top results dominated by breweries/pubs (Toit, Truffles, AB's Absolute Barbecues).
**Insight:** Nightlife/drinks venues generate disproportionately high customer engagement.

### Query 5 — Average cost by location
```sql
SELECT [location], AVG(approx_cost_for_two_people) AS avg_cost
FROM restaurants
WHERE approx_cost_for_two_people IS NOT NULL
GROUP BY [location]
ORDER BY avg_cost DESC;
```
**Result (top 5):** Sankey Road (₹2,506), Race Course Road (₹1,309), Lavelle Road (₹1,308), MG Road (₹1,156), Infantry Road (₹1,062). BTM Layout — highest density — averages just ₹396.
**Insight:** Inverse relationship between restaurant density and pricing power; saturated areas compete on price, low-density premium areas sustain higher prices.

### Query 6 — Online ordering adoption
```sql
SELECT [online_order], COUNT(*) AS cnt,
       CAST(COUNT(*) AS FLOAT) * 100 / SUM(COUNT(*)) OVER() AS pct
FROM restaurants
GROUP BY [online_order];
```
**Result:** Yes — 30,444 (58.9%); No — 21,273 (41.1%).

### Query 7 — Online ordering vs. engagement
```sql
SELECT [online_order], AVG(votes_clean) AS avg_votes, AVG(rate_clean) AS avg_rating
FROM restaurants
GROUP BY [online_order];
```
**Result:** Yes — 307 avg votes, 3.72★ avg rating. No — 250 avg votes, 3.66★ avg rating.
**Caveat:** Correlational, not causal — could reflect confounding (better restaurants more likely to adopt online ordering).

### Query 8 — Top-rated restaurant per locality (deduplicated)
```sql
SELECT [name], [location], rate_clean, rank_in_location
FROM (
    SELECT [name], [location], MAX(rate_clean) AS rate_clean,
           RANK() OVER (PARTITION BY [location] ORDER BY MAX(rate_clean) DESC) AS rank_in_location
    FROM restaurants
    WHERE rate_clean IS NOT NULL
    GROUP BY [name], [location]
) ranked
WHERE rank_in_location = 1
ORDER BY [location];
```
**Result (examples):** AB's - Absolute Barbecues (BTM, 4.9★), Belgian Waffle Factory (Brigade Road, 4.9★), Brahmin's Coffee Bar (Basavanagudi, 4.8★).

---

## 4. Advanced Queries (Day 3)

### Query A — Localities beating the city-wide average rating
```sql
WITH city_avg AS (
    SELECT AVG(rate_clean) AS overall_avg_rating FROM restaurants_unique WHERE rate_clean IS NOT NULL
),
locality_avg AS (
    SELECT [location], AVG(rate_clean) AS avg_rating, COUNT(*) AS restaurant_count
    FROM restaurants_unique
    WHERE rate_clean IS NOT NULL
    GROUP BY [location]
    HAVING COUNT(*) > 20
)
SELECT l.[location], l.avg_rating, l.restaurant_count, c.overall_avg_rating
FROM locality_avg l, city_avg c
WHERE l.avg_rating > c.overall_avg_rating
ORDER BY l.avg_rating DESC;
```
**Result:** City-wide average = **3.64★**. 31 localities exceed it, led by Lavelle Road (4.08★), St. Marks Road (3.94★), Koramangala 5th Block (3.93★), Church Street (3.92★), Race Course Road (3.87★).
**Insight:** These are the same premium, high-cost localities from Query 5 — price and quality are genuinely correlated here.

### Query B — Cumulative customer engagement (votes) by rating tier
```sql
SELECT 
    CAST(rate_clean AS INT) AS rating_bucket,
    COUNT(*) AS restaurant_count,
    SUM(votes_clean) AS total_votes,
    SUM(SUM(votes_clean)) OVER (ORDER BY CAST(rate_clean AS INT)) AS cumulative_votes,
    CAST(SUM(SUM(votes_clean)) OVER (ORDER BY CAST(rate_clean AS INT)) AS FLOAT) * 100 
        / SUM(SUM(votes_clean)) OVER () AS cumulative_pct
FROM restaurants_unique
WHERE rate_clean IS NOT NULL AND votes_clean IS NOT NULL
GROUP BY CAST(rate_clean AS INT)
ORDER BY rating_bucket;
```
**Result:**
| Rating bucket | Restaurants | Total votes | Cumulative % |
|---|---|---|---|
| 1★ | 1 | 225 | 0.01% |
| 2★ | 541 | 58,078 | 2.56% |
| 3★ | 6,508 | 559,260 | 27.12% |
| 4★ | 2,194 | 1,659,320 | 100% |

**Insight:** Restaurants rated 4★+ (23.7% of restaurants) capture **72.9% of all customer votes**. The 3★ majority (70% of restaurants) gets comparatively little engagement (~86 votes/restaurant average vs. ~756 for 4★).

### Query C — Cost tier segmentation
```sql
SELECT 
    CASE 
        WHEN approx_cost_for_two_people < 300 THEN 'Budget'
        WHEN approx_cost_for_two_people BETWEEN 300 AND 700 THEN 'Mid-range'
        WHEN approx_cost_for_two_people BETWEEN 701 AND 1500 THEN 'Premium'
        ELSE 'Luxury'
    END AS cost_tier,
    COUNT(*) AS restaurant_count,
    AVG(rate_clean) AS avg_rating,
    AVG(votes_clean) AS avg_votes
FROM restaurants_unique
WHERE approx_cost_for_two_people IS NOT NULL
GROUP BY 
    CASE WHEN approx_cost_for_two_people < 300 THEN 'Budget' WHEN approx_cost_for_two_people BETWEEN 300 AND 700 THEN 'Mid-range' WHEN approx_cost_for_two_people BETWEEN 701 AND 1500 THEN 'Premium' ELSE 'Luxury' END
ORDER BY avg_rating DESC;
```
**Result:**
| Tier | Range | Restaurants | Avg Rating | Avg Votes |
|---|---|---|---|---|
| Luxury | ₹1500+ | 289 | 4.17★ | 1,050 |
| Premium | ₹701–1500 | 1,551 | 3.88★ | 648 |
| Mid-range | ₹300–700 | 7,183 | 3.58★ | 115 |
| Budget | <₹300 | 3,057 | 3.56★ | 44 |

**Insight:** Luxury restaurants get ~24x more engagement than Budget despite only a 0.6★ rating gap — premium positioning drives disproportionate engagement.

### Query D — Underperforming high-volume cuisines
```sql
SELECT [cuisines], COUNT(*) AS restaurant_count, AVG(rate_clean) AS avg_rating
FROM restaurants_unique
WHERE rate_clean IS NOT NULL
GROUP BY [cuisines]
HAVING COUNT(*) > 50 AND AVG(rate_clean) < 3.5
ORDER BY restaurant_count DESC;
```
**Result:** North Indian+Chinese (448, 3.40★), Biryani (157, 3.44★), Fast Food (129, 3.47★), Chinese (82, 3.46★), Chinese+North Indian (71, 3.43★), North Indian+South Indian+Chinese (68, 3.48★), South Indian+North Indian (61, 3.50★), Cafe+Fast Food (53, 3.33★), Biryani+North Indian (52, 3.32★).
**Insight:** These oversaturated cuisines are exactly the categories with the highest restaurant counts (Query 3) — high supply, mediocre quality.

---

## 5. Market Gap Analysis (Capstone Query)

```sql
WITH high_demand_cuisines AS (
    SELECT [cuisines], COUNT(*) AS city_count, AVG(rate_clean) AS city_avg_rating
    FROM restaurants_unique
    WHERE rate_clean IS NOT NULL
    GROUP BY [cuisines]
    HAVING COUNT(*) > 30 AND AVG(rate_clean) > 3.7
),
active_localities AS (
    SELECT [location], COUNT(*) AS locality_total_restaurants
    FROM restaurants_unique
    GROUP BY [location]
    HAVING COUNT(*) > 100
),
locality_cuisine_presence AS (
    SELECT [location], [cuisines], COUNT(*) AS locality_cuisine_count
    FROM restaurants_unique
    GROUP BY [location], [cuisines]
)
SELECT 
    a.[location], a.locality_total_restaurants,
    h.[cuisines], h.city_count AS citywide_cuisine_count, h.city_avg_rating AS citywide_cuisine_rating,
    ISNULL(l.locality_cuisine_count, 0) AS count_in_this_locality
FROM active_localities a
CROSS JOIN high_demand_cuisines h
LEFT JOIN locality_cuisine_presence l
    ON l.[location] = a.[location] AND l.[cuisines] = h.[cuisines]
WHERE ISNULL(l.locality_cuisine_count, 0) <= 2
ORDER BY h.city_avg_rating DESC, a.locality_total_restaurants DESC;
```

**Result — Headline finding:** "Desserts, Beverages" (47 restaurants city-wide, **4.01★ average**, well above the 3.64★ city average) has **zero presence** in major localities including Electronic City (694 restaurants), Kammanahalli (177), Brookefield (174), Ulsoor (117), and Nagawara (103) — and only 1–2 outlets in most other high-traffic areas (Whitefield, JP Nagar, Sarjapur Road, several Koramangala blocks). "Desserts, Ice Cream" (51 restaurants, 3.87★) shows the same pattern.

**Business recommendation:** Desserts/beverage concepts are a validated, high-quality, currently underserved category — the clearest data-backed expansion opportunity in this dataset.

---

## 6. Power BI Data Import Queries

These 5 queries were used as **custom SQL statements** in Power BI's "Get Data → SQL Server → Advanced options" import, pulling pre-aggregated tables directly rather than raw data.

**Table 1 — `BaseRestaurants`**
```sql
SELECT name, location, cuisines, rate_clean, votes_clean, 
       approx_cost_for_two_people, online_order, book_table, rest_type
FROM restaurants_unique
WHERE location IS NOT NULL
```

**Table 2 — `CuisinePerformance`**
```sql
SELECT cuisines, COUNT(*) AS restaurant_count, AVG(rate_clean) AS avg_rating
FROM restaurants_unique
WHERE rate_clean IS NOT NULL
GROUP BY cuisines
HAVING COUNT(*) > 20
```

**Table 3 — `CostTiers`** (includes `sort_order` for correct tier ordering)
```sql
SELECT 
    CASE WHEN approx_cost_for_two_people < 300 THEN 'Budget' WHEN approx_cost_for_two_people BETWEEN 300 AND 700 THEN 'Mid-range' WHEN approx_cost_for_two_people BETWEEN 701 AND 1500 THEN 'Premium' ELSE 'Luxury' END AS cost_tier,
    CASE WHEN approx_cost_for_two_people < 300 THEN 1 WHEN approx_cost_for_two_people BETWEEN 300 AND 700 THEN 2 WHEN approx_cost_for_two_people BETWEEN 701 AND 1500 THEN 3 ELSE 4 END AS sort_order,
    COUNT(*) AS restaurant_count, AVG(rate_clean) AS avg_rating, AVG(votes_clean) AS avg_votes
FROM restaurants_unique
WHERE approx_cost_for_two_people IS NOT NULL
GROUP BY 
    CASE WHEN approx_cost_for_two_people < 300 THEN 'Budget' WHEN approx_cost_for_two_people BETWEEN 300 AND 700 THEN 'Mid-range' WHEN approx_cost_for_two_people BETWEEN 701 AND 1500 THEN 'Premium' ELSE 'Luxury' END,
    CASE WHEN approx_cost_for_two_people < 300 THEN 1 WHEN approx_cost_for_two_people BETWEEN 300 AND 700 THEN 2 WHEN approx_cost_for_two_people BETWEEN 701 AND 1500 THEN 3 ELSE 4 END
```

**Table 4 — `LocalityQuality`**
```sql
WITH city_avg AS (
    SELECT AVG(rate_clean) AS overall_avg_rating FROM restaurants_unique WHERE rate_clean IS NOT NULL
)
SELECT location, AVG(rate_clean) AS avg_rating, COUNT(*) AS restaurant_count,
       (SELECT overall_avg_rating FROM city_avg) AS city_avg_rating
FROM restaurants_unique
WHERE rate_clean IS NOT NULL AND location IS NOT NULL
GROUP BY location
HAVING COUNT(*) > 20
```

**Table 5 — `EngagementByRating`**
```sql
SELECT CAST(rate_clean AS INT) AS rating_bucket, COUNT(*) AS restaurant_count, SUM(votes_clean) AS total_votes
FROM restaurants_unique
WHERE rate_clean IS NOT NULL AND votes_clean IS NOT NULL
GROUP BY CAST(rate_clean AS INT)
```

### DAX measures created in Power BI

```dax
Online Order % = 
DIVIDE(
    CALCULATE(COUNTROWS(BaseRestaurants), BaseRestaurants[online_order] = "Yes"),
    COUNTROWS(BaseRestaurants)
) * 100
```

```dax
Locality Insight = 
VAR SelectedCount = COUNTROWS(BaseRestaurants)
VAR SelectedAvgRating = AVERAGE(BaseRestaurants[rate_clean])
VAR CityAvg = 3.64
VAR Verdict = IF(SelectedAvgRating > CityAvg, "a competitive, quality-driven market", "a market where you can win on quality alone")
RETURN "This area has " & SelectedCount & " restaurants, averaging " & FORMAT(SelectedAvgRating, "0.00") & "★ — " & Verdict & "."
```

```dax
Cumulative Votes % = 
VAR CurrentBucket = MAX(EngagementByRating[rating_bucket])
VAR RunningTotal = 
    CALCULATE(SUM(EngagementByRating[total_votes]), FILTER(ALL(EngagementByRating), EngagementByRating[rating_bucket] <= CurrentBucket))
VAR GrandTotal = CALCULATE(SUM(EngagementByRating[total_votes]), ALL(EngagementByRating))
RETURN DIVIDE(RunningTotal, GrandTotal) * 100
```

---

## 7. Prompt to give an AI assistant (ChatGPT/Claude) to build the Power BI dashboard

Copy-paste the block below as-is:

```
I'm building a Power BI dashboard for a business owner deciding where and what
type of restaurant to open in Bangalore, based on real analysis of 51,717
Zomato restaurant listings (12,137 unique restaurants after deduplication).

I already have 5 tables imported into Power BI Desktop via custom SQL queries:

1. BaseRestaurants — one row per restaurant: name, location, cuisines,
   rate_clean (rating out of 5), votes_clean (review count), 
   approx_cost_for_two_people, online_order (Yes/No), book_table (Yes/No), rest_type

2. CuisinePerformance — cuisines, restaurant_count, avg_rating (only cuisines
   with 20+ restaurants)

3. CostTiers — cost_tier (Budget/Mid-range/Premium/Luxury), sort_order,
   restaurant_count, avg_rating, avg_votes

4. LocalityQuality — location, avg_rating, restaurant_count, city_avg_rating
   (only localities with 20+ rated restaurants)

5. EngagementByRating — rating_bucket (1-4), restaurant_count, total_votes

I also have 3 DAX measures already created:
- "Online Order %" (on BaseRestaurants)
- "Locality Insight" (on BaseRestaurants) — a dynamic sentence that changes 
  based on the selected locality slicer
- "Cumulative Votes %" (on EngagementByRating)

Key findings from my SQL analysis that the dashboard should visually support:
- City-wide average rating is 3.64★
- BTM Layout has the highest restaurant density (5,124 listings) but low cost
  (₹396 avg) — a saturated, price-competitive market
- Premium localities (Lavelle Road, MG Road, Church Street) have far fewer
  restaurants but both higher cost AND higher average rating (quality hubs)
- "Desserts, Beverages" cuisine is high-rated (4.01★) but nearly absent in
  most major localities — a clear expansion opportunity
- North Indian, Chinese, Biryani, Fast Food cuisines are oversaturated and
  underperform on rating (3.3-3.5★) despite being the most common
- Restaurants rated 4★+ capture 73% of all customer votes despite being only
  24% of restaurants — quality drives engagement disproportionately
- Higher-cost tiers (Premium/Luxury) get dramatically more customer votes
  than Budget/Mid-range, even with only modest rating differences

Please help me design a 3-page Power BI dashboard aimed at a prospective
restaurant owner (not a data analyst) deciding where and what to open:

Page 1 "Where to Open": KPI cards (total restaurants, city avg rating,
% online ordering, avg engagement), a scatter plot of restaurant_count vs
avg_rating by locality with a city-average reference line, a locality
slicer, and a card showing the dynamic "Locality Insight" measure.

Page 2 "What to Serve": bar charts ranking cuisines by volume and by rating,
plus a conditional-formatted table flagging high-opportunity (green) vs
oversaturated (red) cuisines.

Page 3 "Pricing & Positioning": column charts comparing cost tiers by rating
and by average votes, correctly ordered Budget → Mid-range → Premium → Luxury.

For each page, tell me exactly which visual type to use, which fields go in
which wells (axis/values/legend), and any formatting (colors, sort order,
reference lines) needed to make the insights above immediately visible to a
non-technical business owner. Assume I already know how to add visuals in
Power BI Desktop — just tell me the configuration for each one.
```

---

## Summary of Key Numbers (quick reference)

| Metric | Value |
|---|---|
| Raw listings analyzed | 51,717 |
| Unique restaurants | 12,137 |
| City-wide average rating | 3.64★ |
| Restaurants with no rating | 10,052 (19.4%) |
| Online ordering adoption | 58.9% |
| Highest-density locality | BTM Layout (5,124 listings, ₹396 avg cost) |
| Highest-rated locality | Lavelle Road (4.08★) |
| Top validated opportunity cuisine | Desserts, Beverages (47 restaurants, 4.01★, largely absent citywide) |
| Most oversaturated cuisine | North Indian + Chinese (448 restaurants, 3.40★) |
| Vote share captured by 4★+ restaurants | 72.9% (from 23.7% of restaurants) |
| Luxury tier avg votes vs Budget tier | 1,050 vs 44 (~24x) |

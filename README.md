# Spot On Bangalore

Build a single-page web app called "OpenSpot" — a Bangalore restaurant market entry tool, styled like the Zomato Partner app, built from real analysis of 51,717 Zomato listings (12,137 unique restaurants). Unlike a generic BI dashboard, this should feel like a product giving direct, prioritized recommendations — similar in tone to a "restaurant health check" tool, but for someone who hasn't opened yet and is deciding where/what/how to position.

DESIGN (follow exactly):

Background: white / off-white (#FAFAFA)

Primary accent: Zomato red (#E23744) — CTAs, priority tags, highlight numbers only

Secondary signal colors: green (#2E8B57) for "opportunity/good", amber (#D9822B) for "moderate", muted red (#D9534F) for "saturated/avoid"

Text: charcoal (#1C1C1C) headings, gray (#696969) secondary

Font: Poppins or Inter, bold headings and stat numbers

Cards: white, 12px rounded corners, thin border (#EAEAEA), no heavy shadows

Small line icons before section headers (bar-chart icon, lightbulb icon, map-pin icon)

Top nav: 3 tabs (not separate pages — switch content via state, keep this cheap to build): "Overview" | "Opportunity Finder" | "Playbook"

Mobile responsive, cards stack vertically

═══════════════════════════════════════ TAB 1: OVERVIEW ═══════════════════════════════════════

Header: "OpenSpot" in red, tagline "Restaurant Market Intelligence — Bangalore" Subheader: "Know where to open, what to serve, and what to charge — backed by real market data, not guesswork."

4 KPI cards in a row: [ { "label": "Restaurants Analyzed", "value": "12,137" }, { "label": "City Avg Rating", "value": "3.64★" }, { "label": "Avg Cost for Two", "value": "₹492" }, { "label": "Online Ordering Adoption", "value": "58.9%" } ]

Below that, a horizontal bar chart "Where Competition Is Highest": [ {"locality":"BTM","restaurants":5124}, {"locality":"HSR","restaurants":2523}, {"locality":"Koramangala 5th Block","restaurants":2504}, {"locality":"JP Nagar","restaurants":2235}, {"locality":"Whitefield","restaurants":2144}, {"locality":"Indiranagar","restaurants":2083}, {"locality":"Jayanagar","restaurants":1926}, {"locality":"Marathahalli","restaurants":1846} ]

═══════════════════════════════════════ TAB 2: OPPORTUNITY FINDER (the core feature) ═══════════════════════════════════════

Searchable locality dropdown with this data: [ { "locality": "Whitefield", "restaurants": 821, "avgCost": 598, "rating": null, "dessertGap": 1 }, { "locality": "Electronic City", "restaurants": 694, "avgCost": 497, "rating": null, "dessertGap": 0 }, { "locality": "Marathahalli", "restaurants": 657, "avgCost": 514, "rating": null, "dessertGap": 1 }, { "locality": "JP Nagar", "restaurants": 501, "avgCost": 523, "rating": 3.65, "dessertGap": 1 }, { "locality": "Bannerghatta Road", "restaurants": 448, "avgCost": 444, "rating": null, "dessertGap": 2 }, { "locality": "Bellandur", "restaurants": 349, "avgCost": 528, "rating": null, "dessertGap": 2 }, { "locality": "Sarjapur Road", "restaurants": 326, "avgCost": 574, "rating": null, "dessertGap": 1 }, { "locality": "Malleshwaram", "restaurants": 231, "avgCost": 551, "rating": 3.74, "dessertGap": 1 }, { "locality": "Basavanagudi", "restaurants": 205, "avgCost": 361, "rating": 3.69, "dessertGap": 1 }, { "locality": "Koramangala 4th Block", "restaurants": 133, "avgCost": 696, "rating": 3.84, "dessertGap": 1 }, { "locality": "Brigade Road", "restaurants": 126, "avgCost": 651, "rating": 3.72, "dessertGap": 1 }, { "locality": "Ulsoor", "restaurants": 117, "avgCost": 766, "rating": 3.74, "dessertGap": 0 }, { "locality": "Nagawara", "restaurants": 103, "avgCost": 433, "rating": null, "dessertGap": 0 } ]

Calculate live in the browser when a locality is selected:

competitionScore = 100 * (821 - restaurants) / (821 - 103)

demandScore = a fixed placeholder scaling from avgCost (higher cost area = higher demand score, normalize avgCost between 361 and 766 to a 0-100 scale)

ratingScore = if rating is not null, scale (rating - 3.4) / (4.1 - 3.4) * 100, else default to 40

opportunityIndex = ROUND(competitionScore0.40 + demandScore0.35 + ratingScore*0.25)

band = "Saturated" if <40, "Worth a closer look" if 40-70, "High Opportunity" if >70

LAYOUT for this tab, top to bottom:

Large centered score card showing Opportunity Index (0-100) with colored ring/badge matching the band (red/amber/green), band label below the number

A "vs City Average" comparison table (mirrors a side-by-side benchmark table): | Metric | This Locality | City Average | Signal | Rows: Restaurant Count (vs typical ~135 median), Avg Cost (vs ₹492), Avg Rating (vs 3.64, or "Not independently confirmed" if rating is null), Dessert/Beverage Supply (vs proven category, flag green if dessertGap<=1) Color the "Signal" column green/red per row based on whether that locality looks favorable or not on that specific metric.

"Actionable Insights" section — 3 cards, each with: a small icon, a title, a priority tag (High/Medium/Low priority, styled as a small pill), a 1-2 sentence description using the real numbers, and NO fake CTA button (since there's no backend action to take — just show the recommendation text in bold at the bottom of each card instead of a clickable button):

Card 1 (High priority): "Dessert & Beverage Gap" "This category is proven at 4.01★ citywide (47 restaurants) but this locality has only {dessertGap} such outlet(s). Underserved, high-rated categories are the strongest opportunity signal in this dataset."

Card 2 (Medium priority): "Pricing Position" "Premium-tier restaurants (₹701-1500) average 648 votes vs. just 115 for Mid-range — a 5.6x engagement gap for a modest quality bar. Consider positioning above budget/mid-range if execution quality supports it."

Card 3 (High priority): "Quality Bar to Clear" "Restaurants rated 4★+ capture 72.9% of all customer votes citywide despite being only 23.7% of restaurants. In a market this competitive, 'good enough' quality is effectively invisible — plan to clear 4★, not just the local average."

"Opportunity Breakdown" — a small horizontal stacked bar or 3 mini progress bars showing how much each factor contributed to the score: Competition (weight 40%), Demand (weight 35%), Rating (weight 25%) — with the actual calculated sub-scores for the selected locality.

═══════════════════════════════════════ TAB 3: PLAYBOOK (cuisine + pricing reference) ═══════════════════════════════════════

Two-column list, side by side: Opportunities (green header): [ {"cuisine":"Desserts, Beverages","rating":4.01,"count":47}, {"cuisine":"Desserts, Ice Cream","rating":3.87,"count":51} ] Avoid — Oversaturated (red header): [ {"cuisine":"North Indian, Chinese","rating":3.40,"count":448}, {"cuisine":"Biryani","rating":3.44,"count":157}, {"cuisine":"Fast Food","rating":3.47,"count":129}, {"cuisine":"Cafe, Fast Food","rating":3.33,"count":53} ]

Below that, a simple bar chart "Pricing Tier vs. Customer Engagement": [ {"tier":"Budget","avgVotes":44,"avgRating":3.56}, {"tier":"Mid-range","avgVotes":115,"avgRating":3.58}, {"tier":"Premium","avgVotes":648,"avgRating":3.88}, {"tier":"Luxury","avgVotes":1050,"avgRating":4.17} ] Callout text below: "Luxury-tier restaurants get ~24x more customer engagement than Budget, on only a 0.6★ rating difference."

═══════════════════════════════════════ FOOTER (all tabs) ═══════════════════════════════════════ "Built from SQL analysis of 51,717 real Zomato Bangalore listings. Decision- support signal, not a guarantee — pair with on-ground research before committing capital."

CONSTRAINTS:

No backend, no database, no auth — hardcode all data directly in the frontend

Tabs switch via component state, not page routing

Simple, lightweight chart components only — no 3D or heavily animated charts

Do not add extra tabs, extra sections, or a feedback form unless asked in a follow-up

Do not fabricate additional restaurants, dishes, or numbers beyond what's given above

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://open-spot-insight.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c014699c-7e60-489a-aef2-a9a6b9eae9bc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

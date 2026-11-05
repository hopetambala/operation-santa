---
title: Route planner
parent: "December: routes"
nav_order: 2
description: "Plan balanced routes that fit the evening, then adjust them with local knowledge."
---

# Route planner
{: .no_toc }

**Who:** route planner.
**When:** first draft from about December 1, again whenever sign-ups change, and a final rebalance before the freeze.

1. TOC
{:toc}

{: .why }
In 2025 three people planned routes in three separate MyRouteOnline accounts, so no one could balance the whole city: routes ranged from 2 to 23 families. Every stop was planned at a flat 10 minutes, which ignored apartments (almost half of all stops) and big families. One route was planned past the 8:30 PM end of the window, and twelve more ran over three and a half hours. The app plans every route together, times each stop by what it really takes, and refuses to print a route that can't finish in time.

## Before you start

- Geocode, and clear the **Addresses** tab in [Address review]({{ '/sign-ups/address-review/' | relative_url }}). Families without a confirmed address can't be routed.
- Check the North Pole address, departure time and route limits in [Settings]({{ '/reference/settings/' | relative_url }}).

## How the app times a route

Each stop takes a **base time** (7 minutes), plus time for each extra child, an apartment, a gate code and extra toys, minus a little when the next stop is in the same building. Driving is estimated from the distance at an average speed, plus a minute and a half to park. All of these are in Settings ▸ "Service time model".

Every route leaves the North Pole at the departure time (4:30 PM by default) and comes back there. Two limits matter:

- **Target** (3h 15m by default): routes should come in under this. Over it is a warning.
- **Hard maximum** (3h 45m by default, and never later than 15 minutes before the window ends): a route over this can't print.

The "Estimated travel" badge is a reminder that times are estimates from straight-line distance, not live traffic.

## Plan the routes

1. Go to **Route planner**.
2. Choose how many teams to plan for, under "Fleet":
   - **Fixed count**: type the number of teams you have in "Teams".
   - **Fewest that fit**: the app works out the smallest number of teams that gets every family home within the hard maximum.
3. Click **Rebalance unlocked**. It shows "Planning…" for a few seconds.
4. Read the message: for example "38 routes planned. Longest 3h 12m, spread 41 min."

The read-outs at the top show:

- "TARGET · LIMIT": your two time limits.
- "LONGEST · SPREAD": the longest route, and the gap between the longest and shortest. Aim for a spread of 45 minutes or less.
- "UNROUTED": home-delivery families not on any route, with out-of-area families counted separately.

![The Route planner on the demo season: the route list, and Route 01 selected on the map]({{ '/assets/images/route-planner.png' | relative_url }})

### When families don't fit

If there aren't enough teams, a yellow note stays under the controls: "12 families don't fit on 45 teams within the 3h 45m limit." You can:

- switch "Fleet" to **Fewest that fit** and rebalance, to see how many teams it really takes, then recruit to that number;
- add teams and rebalance; or
- with the committee's agreement, raise the hard maximum in Settings.

{: .note }
Because the app counts real stop times, it may need more teams than 2025's 45 for the same number of families. That's the honest number: in 2025 the shortfall showed up as routes running late.

### What a rebalance keeps

**Rebalance unlocked** rebuilds every ordinary, unlocked route from scratch, but it keeps:

- **locked routes** exactly as they are;
- **special routes** and their families;
- **pinned families** on the route they're pinned to;
- **buildings together**: every family at one address stays on one route, one after another;
- **route numbers**, when a route keeps most of its families, so a team doesn't swap from Route 7 to Route 31 between drafts;
- each route's **team**, on the same terms.

Out-of-area families are never put on ordinary routes; they wait for a special route or pickup.

## Look at one route

Click a route in the list on the left. Each card shows the route's number and name, duration (with a bar that turns amber over the target and red over the limit), families, children, miles, team and finish time.

The right side shows the route on a map, then:

- the title, like "Route 3 · 16 stops · 3h 5m · back 7:35 PM", and how many blocking checks it has;
- **Team** and **Start** (to start one route earlier or later than everyone else);
- the stops in order, each with its family, address, gate code and estimated arrival time.

Click a family's name to open their card.

## Adjust by hand

Local knowledge beats the map. All of these work on a whole building at a time.

| To… | Do this |
|---|---|
| Visit a stop earlier or later | Click the **↑** or **↓** arrow next to it. |
| Move a stop to another route | Choose the route from the menu at the right of the stop. |
| Take a stop off its route | Choose **Remove from route** from that menu. |
| Put an unrouted family on a route | In the "home deliveries without a route" table below the routes, choose a route under "ADD TO ROUTE". |
| Re-order one route for the shortest drive | Click **Re-sequence**. Only that route changes. |
| Keep a family on this route through rebalances | Click the **pin** icon next to the stop. Click again to unpin. |
| Keep a whole route exactly as it is | Click **Lock**. **Unlock** to allow changes again. |
| Remove a route with no stops | Click **Delete**. Only empty routes show this button. |

A story: Team 4's lead has delivered to the same senior apartment complex for years and knows which door to use. After the first rebalance, the planner moves the complex's families onto Route 4, re-orders the stops so the complex comes first, and clicks **Lock**. Later rebalances move other routes around Route 4 but never touch it.

{: .note }
A locked route can't be changed at all: no moves in or out, no reordering. Unlock it first. A pinned family can't be moved either until you unpin them.

## Special routes

A special route keeps its families through every rebalance. Use one for:

- a named apartment complex or site that one team covers;
- an out-of-area run for families outside the service area;
- a second, short route for a team that finishes early.

To make one:

1. Click **Special route**.
2. Type a "Route name", for example "Maple Court Apts".
3. Click **Create route**. The new, empty route opens.
4. Add families from the unrouted table ("ADD TO ROUTE"), or move them from other routes with each stop's route menu.

Out-of-area families can only go on special routes, unless they're marked **Include anyway** in Address review.

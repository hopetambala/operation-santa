---
title: Settings
parent: Reference
nav_order: 1
description: "Every setting in the Settings page, its default, and what it changes."
---

# Settings
{: .no_toc }

**Who:** coordinator.

1. TOC
{:toc}

{: .why }
In 2025 the routing settings lived in each MyRouteOnline account and the print layout lived in a Word template on one laptop. Here they're stored in the season file itself, so everyone working on the season uses the same ones.

Change any value under "Season settings", then click **Save settings** at the bottom. After the plan is frozen or printed, the app asks for a reason, and every changed setting is recorded in the [Change log]({{ '/reference/change-log/' | relative_url }}).

<!-- screenshot: Settings page on the demo season -->

## Season

| Setting | Default | What it does |
|---|---|---|
| Your display name | Coordinator | Your name on every change you make, on letters you review, and on cleanup packets you send. Set it on each computer. |
| Season year | 2026 | Shown at the top of every page and used for the purge reminder. |

## North Pole and delivery window

| Setting | Default | What it does |
|---|---|---|
| North Pole address | 150 N Madison Ave, Pasadena, CA 91101 | Where every route starts and ends. Printed on covers and used in phone links. |
| North Pole phone (printed on packets) | blank | The number team leads call on the night. Fill it in. |
| Depot latitude / Depot longitude | 34.1478 / -118.1445 | The North Pole on the map. **If you change the address, change these too.** |
| Departure time | 4:30 PM | When routes leave (a single route can start at a different time in the Route planner). |
| Delivery window ends | 8:30 PM | The end of the visiting window. |
| Target route (minutes) | 195 (3h 15m) | Routes should come in under this; over it is a warning. |
| Hard maximum (minutes) | 225 (3h 45m) | Routes over this can't print. Must be at least 15 minutes before the window ends. |
| Number of teams | 8 | The same as "Teams" in the Route planner. |
| Team count | Fixed | The same as "Fleet" in the Route planner: **Fixed** or **Fewest that fit**. |

## Service time model

How long each stop takes, in minutes. A stop is never counted as less than 5 or more than 25 minutes.

| Setting | Default | What it does |
|---|---|---|
| Base stop time | 7 | Every stop. |
| Per extra child | 1.5 | Added for each child after the first. |
| Apartment | 3 | Added when the family has a unit number. |
| Gate code | 2 | Added when the family has gate or access notes. |
| Extra toys | 3 | Added for families flagged extra toys. |
| Same-building discount | 3 | Taken off for a second family in the same building. |
| Estimated speed (mph) | 18 | Average driving speed between stops. |
| Road distance multiplier | 1.35 | Roads are longer than a straight line; this stretches the straight-line distance. |
| Parking per stop (min) | 1.5 | Added to every drive. |

{: .why }
2025 planned a flat 10 minutes for every stop, whether it was a house with one child or an apartment with six behind a gate. That's how twelve routes ran past three and a half hours.

## Service area

| Setting | Default | What it does |
|---|---|---|
| Cities served | Pasadena, Altadena, South Pasadena, San Marino, Sierra Madre | Families outside these cities appear on Address review ▸ **Out of area**. |
| Buffer beyond city limits (miles) | 1 | How far past each city's edge still counts as inside. |

{: .note }
The app knows the shape of these five cities only. Adding another city's name to the list doesn't widen the area for families already on the map.

## Printing

| Setting | Default | What it does |
|---|---|---|
| Children per bag | 3 | How many children's gifts go in one bag; sets the bag count on manifests and labels. |
| Labels | Avery 5163 | Label sheet: Avery 5163 (10 a sheet) or Avery 5160 (30 a sheet). Also in the Print center. |
| Label start slot | 1 | First free label on the sheet. Also in the Print center. |
| Street address on labels | off | Adds the street address to each bag label. |
| Stops per Google Maps link (max 9) | 9 | How many stops each phone link and QR code covers. |
| Flag letters longer than (characters) | 1500 | Letters longer than this get a warning in Letter cleanup. |

## Airtable (read-only)

| Setting | What it is |
|---|---|
| Base ID (app…) | The part of the Airtable address starting with `app`. |
| Table ID or name | The part starting with `tbl`, or the table's name. |

The Airtable token isn't a season setting; it's saved on the right under "Airtable connection". See [Sync from Airtable]({{ '/sign-ups/airtable-sync/' | relative_url }}).

## Other panels on the Settings page

- **Your season, on your device**: **New encrypted season**, **Open season file**, **Create encrypted backup**, **Open a cleanup packet**, **Check for updates**. See [Season files and passphrases]({{ '/start-here/season-file/' | relative_url }}) and [Install and update]({{ '/start-here/install/' | relative_url }}).
- **Airtable connection**: the read-only token.
- **After the season**: **Purge sensitive records**. See [Purge at season end]({{ '/after-the-season/purge/' | relative_url }}).

## If Save settings is refused

| Message | Fix |
|---|---|
| Target must be below the hard maximum, and the maximum must leave 15 minutes before the window ends. | Lower the target or the maximum, or move the window's end later. |
| Google Maps links hold 1 to 9 stops. | Set "Stops per Google Maps link" between 1 and 9. |
| Base time, speed, multiplier and children per bag must be above zero. | Fix whichever is 0 or blank. |

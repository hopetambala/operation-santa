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

Change any value under "Season settings", then click **Save settings** at the bottom. If the change alters a printed packet (start time, North Pole address, children per bag, street address on labels), the app asks for a reason, and every changed setting is recorded in the [Change log]({{ '/reference/change-log/' | relative_url }}).

![The Settings page on the demo season]({{ '/assets/images/settings.png' | relative_url }})

## Season

| Setting | Default | What it does |
|---|---|---|
| Your display name | Coordinator | Your name on every change you make, on letters you review, and on cleanup packets you send. Set it on each computer. |
| Season year | 2026 | Shown at the top of every page and used for the purge reminder. |

## North Pole and delivery window

| Setting | Default | What it does |
|---|---|---|
| North Pole address | 150 N Madison Ave, Pasadena, CA 91101 | Where every route starts and ends. Printed on covers and used in phone links. If you change it, change "Depot latitude" and "Depot longitude" under Advanced too. |
| North Pole phone (printed on packets) | blank | The number team leads call on the night. Fill it in. |
| Departure time | 4:30 PM | When routes leave (a single route can start at a different time in the Route planner). |
| Delivery window ends | 8:30 PM | The end of the visiting window. |
| Target route (minutes) | 195 (3h 15m) | Routes should come in under this; over it is a warning. |
| Hard maximum (minutes) | 225 (3h 45m) | Routes over this can't print. Must be at least 15 minutes before the window ends. |

The number of teams and "Fleet" are set in the [Route planner]({{ '/routing/route-planner/' | relative_url }}), and the 9 stop and travel times in its **Route settings** panel. The label sheet and "Street address on labels" are set in the [Print center]({{ '/printing/labels/' | relative_url }}). Each setting has one home.

## Service area

| Setting | Default | What it does |
|---|---|---|
| Cities served | Pasadena, Altadena, South Pasadena, San Marino, Sierra Madre | Families outside these cities appear on Address review ▸ **Out of area**. The five default cities are checked by distance; a city you add is matched by the city name on the sign-up. |
| Buffer beyond city limits (miles) | 1 | How far past each city's edge still counts as inside. |

{: .note }
The app knows the shape of these five cities only. Adding another city's name to the list doesn't widen the area for families already on the map.

## Printing

| Setting | Default | What it does |
|---|---|---|
| Children per bag | 3 | How many children's gifts go in one bag; sets the bag count on manifests and labels. |

## Advanced

Leave these as they are unless you know why.

| Setting | Default | What it does |
|---|---|---|
| Depot latitude / Depot longitude | 34.1478 / -118.1445 | The North Pole on the map. **If you change the North Pole address, change these too.** |
| Stops per Google Maps link (max 9) | 9 | How many stops each phone link and QR code covers. |
| Flag letters longer than (characters) | 1500 | Letters longer than this need a look in Letter cleanup. |

Two switches for features that could be useful but haven't been tried in a real season yet. Both start **off**, and while a switch is off its buttons don't appear anywhere. Tick one and click **Save settings** to turn it on.

| Switch | Default | What it adds |
|---|---|---|
| Airtable Sync | off | **Sync Airtable** on Families, the "Airtable (read-only)" settings below, the "Airtable connection" token panel, and fresh links for expired drawings. See [Sync from Airtable]({{ '/sign-ups/airtable-sync/' | relative_url }}). |
| Send letters to helpers | off | **Cleanup packet** and **Import returned packet** on Letter cleanup. See [Cleanup packets]({{ '/sign-ups/cleanup-packets/' | relative_url }}). |

## Airtable (read-only)

Shown only with Advanced ▸ "Airtable Sync" on.

| Setting | What it is |
|---|---|
| Base ID (app…) | The part of the Airtable address starting with `app`. |
| Table ID or name | The part starting with `tbl`, or the table's name. |

The Airtable token isn't a season setting; it's saved on the right under "Airtable connection". See [Sync from Airtable]({{ '/sign-ups/airtable-sync/' | relative_url }}).

## Other panels on the Settings page

- **Your season, on your device**: where the season is kept, and **Check for updates** (installed copies outside the App Store). Create, open and lock seasons from the avatar menu. See [Season files and passphrases]({{ '/start-here/season-file/' | relative_url }}) and [Install and update]({{ '/start-here/install/' | relative_url }}).
- **Airtable connection** (with Advanced ▸ "Airtable Sync" on): the read-only token.
- **After the season**: **Purge sensitive records**. See [Purge at season end]({{ '/after-the-season/purge/' | relative_url }}).

## If Save settings is refused

| Message | Fix |
|---|---|
| Target must be below the hard maximum, and the maximum must leave 15 minutes before the window ends. | Lower the target or the maximum, or move the window's end later. |
| Google Maps links hold 1 to 9 stops. | Set Advanced ▸ "Stops per Google Maps link" between 1 and 9. |
| Base time, speed, multiplier and children per bag must be above zero. | Fix whichever is 0 or blank (base time, speed and multiplier are in the Route planner's **Route settings**). |

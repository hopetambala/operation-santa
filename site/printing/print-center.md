---
title: Check and print team packets
parent: "December 19: printing"
nav_order: 1
description: "Fix what blocks printing, then print one complete packet per Santa team."
---

# Check and print team packets
{: .no_toc }

**Who:** print lead, with the coordinator for anything that blocks printing.
**When:** about December 19, after the plan is frozen.

1. TOC
{:toc}

{: .why }
In 2025 a team needed two documents that didn't match: a route sheet from MyRouteOnline without gate codes or unit numbers, and letters from a Word merge that printed "None" in about 212 addresses and raw web links instead of about 160 drawings. The letters were then hand-sorted into routes. Each packet the app prints is complete and already in stop order, and the app refuses to print a route with a problem a team would hit at the door.

## What's in a team packet

Each route's packet runs in this order. Every page carries the route, its version and print time, the page number, and "Confidential family information. Shred after December 26."

1. **Cover**: route name, team, lead and phone, the North Pole's address and phone, number of stops, children and bags, leave and return times, a simple map with numbered stops, and QR codes that open the route in Google Maps on a phone.
2. **Route sheet**: one row per stop with arrival time, family and Entry ID, address with unit, gate or access notes, phone, children and bags, flags (ES Spanish speaker, +T extra toys, AF adopt-a-family), and a box to tick.
3. **Packing manifest**: every bag, listed from the last stop to the first, so the car is loaded with the first stop's bags on top. Each bag shows the children in it and their first choice.
4. **Letters**, one family after another in stop order, in the same layout as the 2025 letters: Rudolph Route, Eaton status, family name, address, gate code, phone, a gift table with one row per child, notes, then each child's letter and drawings. Each family's first page is headed "Route 3 · Stop 5 of 16".
5. **Bag labels**, one per bag. See [Bag labels]({{ '/printing/labels/' | relative_url }}).

See [Your team packet]({{ '/christmas-eve/team-lead/' | relative_url }}) for how a team lead uses it.

![The cover page of a demo route packet: route, team lead, map and phone-navigation QR code]({{ '/assets/images/route-packet-cover.png' | relative_url }})

## 1. Check before printing

1. Go to **Print center**.
2. Under "Check before printing", read the summary: "3 problems block printing. 12 warnings." or "No blocking problems."
3. Click **Show details** to list them, with the route and Entry ID for each.

Each route also has its own card saying "Ready to export", "Ready · 2 warnings" or "2 checks block printing", with the first few problems. Click **Review** on a card to open that route in the Route planner.

### Problems that block printing

| Problem | Fix it in |
|---|---|
| 36 home deliveries have no route: 30 don’t fit…, 4 need an address, 2 are out of area. (blocks **All routes, one PDF** and **One PDF per route** only) | Route planner: add teams or rebalance; Address review for addresses; move families to pickup, a special route, or cancel them |
| Assign a team. | Route planner ▸ the route ▸ **Team** |
| Route has no stops. | Route planner: add stops or **Delete** the route |
| Route exceeds the delivery limit. | Route planner: move stops off, or add a team and rebalance |
| #26014: review the address. | Address review |
| #26014: placeholder text in the address or name. | Families: remove "None", "N/A" or similar |
| #26014: cancelled family is still routed. / pickup family is still routed. | Route planner: **Remove from route** |
| #26014: child 2's letter needs a look. | Letter cleanup |
| #26014: child 1's letter is empty and has no upload. | Letter cleanup, or Families ▸ Children & letters |
| #26014: child 1's upload is still downloading. / … failed to download | Letter cleanup: **Retry**, or **Skip upload (print placeholder)** |
| #26014: building is split across routes. | Route planner: move the rest of the building onto one route |

### Warnings (print anyway, but look)

- The route runs over the target time, or has fewer than 6 stops (a candidate to merge).
- A drive between two stops is over 3 miles (a likely misplaced pin).
- A family isn't verified, or was missing from the latest import.
- A family has more than 6 children (check the bag count).
- A letter contains a phone number, email or link, or the family's letters will run past 3 pages.
- A Spanish-speaking family is on a team without a Spanish speaker.

## 2. Print

Tick "Duplex (each family starts on a new sheet)" if you'll print double-sided. The app adds blank backs where needed so no family's letter shares a sheet with another family's.

Then choose one:

- **All routes, one PDF**: every route in a single PDF, named like `ALL ROUTES - 2026-12-19 1430.pdf`. Easiest for one big print run.
- **One PDF per route**: choose a folder, and the app saves one file per route, named like `Route 3 - v1 - 2026-12-19 1430.pdf`.
- **Export PDF** on a single route's card: just that route.

These buttons are greyed out while anything blocks printing.

Each print is recorded. The route's card changes from "Not printed" to "Up to date", and the version number goes up by one each time it's printed.

{: .warning }
Once a route is printed, any change that touches it asks for a reason and marks the packet "Needs reprint". See [Reprints and the call list]({{ '/printing/reprints/' | relative_url }}).

## Phone links for team leads

Each route card has a **Phone links** button. It opens the route as a short text message: one Google Maps link per leg of up to 9 stops, the last leg ending back at the North Pole. Click **Copy** and paste it into a text to the team lead.

The links contain addresses only, never names. They work best in the Google Maps app: phone web browsers only show a few stops of a long route. The same links are the QR codes on the packet's cover.

Change how many stops go in each link in Settings ▸ Advanced ▸ "Stops per Google Maps link (max 9)".

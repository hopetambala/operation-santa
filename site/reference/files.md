---
title: Files and formats
parent: Reference
nav_order: 3
description: "The files Operation Santa opens and saves, and the columns it expects."
---

# Files and formats
{: .no_toc }

1. TOC
{:toc}

## Files the app keeps encrypted

| File | What it is | Made by |
|---|---|---|
| `Operation Santa 2026.opsanta` | The season: every family, child, letter, drawing, route, team, setting and change. Encrypted with the season passphrase. | **Create new season** |
| `<time>-<code>.opsanta` in the app's backups folder | A backup of the season, same passphrase. The latest 20 are kept. See [Backups]({{ '/start-here/season-file/' | relative_url }}#backups). | automatic, or **Create encrypted backup** |
| `Cleanup 26001-26199.opsanta-packet` | A cleanup packet: some families' letters, wishes and drawings. Encrypted with its own passphrase. | Letter cleanup ▸ **Cleanup packet** |
| `Cleaned by Ana.opsanta-packet` | A cleaner's returned packet. | **Save edited packet** |

## Files the app reads

### The sign-up export (CSV or Excel)

The Airtable sign-ups table, downloaded with the view's **Download CSV**, or an `.xlsx` with the same columns. The only required column is **Entry ID**. The app also reads these, by their exact names:

| Area | Columns |
|---|---|
| Family | Family Name, Contact Phone Number, Contact Email, Created On |
| Address | House Number, Ordinal, Street Name, Suffix, Apartment/Unit, City & State, Zip Code, Gate Code / Additional Address Info (or a single Full Address column) |
| Map position (optional) | Latitude, Longitude |
| Questions | Below the Poverty Level? (printed as Rudolph Route), the hardship question ending in "Eaton Fire / Hardship" (any year), Previous Participation, How did you hear about us?, Other Open Answer |
| Notes | Jaycee Notes, Additional Information, Special Requests Notes |
| Children | Number of Children (#), and for each child 1 to 13: Child #1: Name, Child #1: Age, Child #1: Age Grouping, Child #1: Gender, Child #1: First Choice, Child #1: Second Choice, Child #1: Letter to Santa, Child #1: Upload Letter to Santa |

Blank address parts, and values like "None" or "N/A", are left out, so they never print.

### The teams spreadsheet (CSV or Excel)

Columns **Team**, **Lead**, **Phone**, **Spanish**, **Seats**, **Notes**. See [Santa teams]({{ '/routing/teams/' | relative_url }}#import-teams-from-a-spreadsheet).

## Files the app saves (not encrypted)

| File | Contents | From |
|---|---|---|
| `Route 3 - v1 - 2026-12-19 1430.pdf` | One team packet | Print center ▸ **Export PDF** or **One PDF per route** |
| `ALL ROUTES - 2026-12-19 1430.pdf` | Every team packet | **All routes, one PDF** |
| `NEEDS REPRINT - 2026-12-19 1430.pdf` | Every out-of-date packet | **Needs reprint (N)** |
| `Route 3 - v2 replacement pages - ….pdf` | Replacement pages | **Replacement pages** |
| `Pickup event - v1.pdf` | Check-in sheet, letters and labels for pickup families | **Pickup event packet (N)** |
| `Coordinator holds - ….pdf` | Letters held back from the teams | **Coordinator holds (N)** |
| `Label alignment test 5163.pdf` | Outlines of every label | **Alignment test page** |
| `MyRouteOnline.csv` | Entry ID, address and planned stop minutes for every home-delivery family the app would route | **MyRouteOnline CSV** or **Fallback CSV** |
| `Operation Santa teams.csv` | Teams, leads, phones and routes | Teams ▸ **Export CSV** |
| `Operation Santa change log.csv` | Every recorded change | Change log ▸ **Export CSV** |

{: .warning }
These files aren't protected by the season passphrase. Keep them on the print computer, and delete them after December 26. The purge doesn't reach them.

---
title: Purge at season end
parent: After the season
nav_order: 1
description: "Permanently delete children's and families' personal details from the season, its backups and your exports."
---

# Purge at season end
{: .no_toc }

**Who:** coordinator.
**When:** after December 26, and by January 31.

1. TOC
{:toc}

{: .why }
The season holds children's names, letters and drawings, and families' addresses, phone numbers and emails. None of it is needed once the gifts are delivered, and keeping it only creates risk. In 2025 those details stayed in exports, merged Word files and spreadsheets on several laptops with no plan to delete them. The purge removes them from the season file and its backups in one step, leaving only counts.

## What the purge deletes, and what it keeps

**Deleted:**

- children's names (they become "Child 1", "Child 2"…), letters, drawings and uploads;
- families' names (they become "Family 26014"), phone numbers, emails, gate codes, notes, printed notes and the original form data;
- the change log and the snapshots of what was printed;
- every backup of this season.

**Kept:**

- counts of families, children and routes;
- children's ages;
- routes as anonymous shapes (the Entry IDs on each route, with no names).

{: .warning }
**Draft, to fix before publishing:** today's purge also leaves each family's street address and map pin, the form's hardship and Rudolph Route answers, and the list of geocoded addresses in the season file. Until the app removes those too, keep the purged season file somewhere private, or delete it.

## Before you purge

1. Make sure the committee is finished with the season: thank-you notes sent, questions about missed stops answered.
2. Note any numbers you want for the wrap-up report (families, children, routes) from the Overview. They'll still be there afterwards, but it's easier now.

## Purge

1. Open the season.
2. Go to **Settings**. Under "After the season", click **Purge sensitive records**.
3. Read the box. In "Type PURGE CHILD DATA to continue", type `PURGE CHILD DATA` exactly, in capitals.
4. Click **Purge now**.

The app takes one last backup in case something goes wrong, purges, then deletes all of this season's backups. A message confirms the counts. Settings shows "Purged" with the date and time.

{: .warning }
The purge can't be undone. That's the point.

![The "Purge sensitive records" box with the confirmation field (demo season)]({{ '/assets/images/purge-dialog.png' | relative_url }})

After January 31, Settings reminds you: "It is past January 31. Please purge this season."

## Delete everything outside the app

The purge only reaches the season file and its backups. Delete these yourself, and empty the Trash or Recycle Bin:

- every exported PDF: team packets, replacement pages, the pickup packet, coordinator holds and label tests;
- `MyRouteOnline.csv`, `Operation Santa teams.csv` and `Operation Santa change log.csv`;
- the Airtable CSV downloads;
- cleanup packets (`.opsanta-packet`), on your computer and on each cleaner's;
- printed packets: shred them.

Then remove the Airtable token from each computer: Settings ▸ "Airtable connection" ▸ **Remove**.

---
title: Import the Airtable CSV
parent: "November: sign-ups"
nav_order: 1
description: "Download the sign-ups from Airtable and import them, as often as you like."
---

# Import the Airtable CSV
{: .no_toc }

**Who:** coordinator.
**When:** as soon as sign-ups start, then every few days until the form closes, and once more after it closes.

1. TOC
{:toc}

{: .why }
In 2025 the export needed a custom cleanup script before anything could use it (curly quotes, line breaks inside letters, rows with the wrong number of columns), and the list was only exported once, near the end. The app reads the export exactly as Airtable gives it, and you can import it again and again: new families are added, changed ones updated, and nothing you fixed by hand is lost.

## 1. Download the CSV from Airtable

1. In Airtable, open the Operation Santa sign-ups table.
2. Open the view's menu (the small arrow next to the view's name) and choose **Download CSV**.
3. Import it into the app **within a few hours**. The links to children's drawings in the file stop working after a few hours.

{: .tip }
Use a view that shows **every** field. If the view hides a column, the app imports that field blank and warns you about it.

## 2. Import it

1. Open your season. Imports don't work in the demo; you'll see "Create or open an encrypted season before importing family records."
2. Go to **Overview** or **Families** and click **Import families** at the top right.
3. Choose the CSV file you downloaded. Excel files (`.xlsx`) work too.

## 3. Review the import {#review-the-import}

The "Review your import" box shows what will change before anything does:

- **new**: Entry IDs the season hasn't seen.
- **changed**: families whose sign-up changed since the last import. Click one to see each field as old → new. "2 in-app edits kept" means you'd fixed two things by hand; those stay as you left them.
- **missing**: families in the season that aren't in this file (for example, someone deleted a duplicate in Airtable). They're marked, never deleted.
- **uploads to download**: drawings and uploaded letters.
- **with proposed flags**: families whose notes suggest a flag, such as Spanish speaker or pickup. Nothing is applied until you confirm it in [Address review]({{ '/sign-ups/address-review/' | relative_url }}).

Read the yellow warnings, if any. They name the problem and what to do. For example:

- "This export has no column for …": the Airtable view is hiding fields. Download again from a view that shows them.
- "… gave a hardship answer the app doesn't recognize, so none … proposed for pickup": check those families in Families and set their delivery yourself.
- "#26014: form says 3 children but 2 were filled in": open the family and check.

Click **Accept import** to bring it in, or **Cancel import** to change nothing.

!["Review your import" with its five counts and one changed demo family expanded]({{ '/assets/images/import-review.png' | relative_url }})

## 4. Let the uploads download

Right after you accept, the app downloads every drawing and uploaded letter and turns it into a print-ready picture. A message says "Imported 12 new and 3 updated families. 0 missing from this export were flagged. Downloading uploads…" and later reports how many converted.

You can keep working while this happens. Progress shows at the top of [Letter cleanup]({{ '/sign-ups/letter-cleanup/' | relative_url }}).

{: .note }
If uploads say "Link expired. Download a fresh CSV from Airtable and import it again; drawings download right after.", that's what to do. The fresh import replaces the dead links and the drawings download.

## What a re-import does

A story: the Bennett family (Entry ID 26014) signs up on November 3. You import them, and in Address review you fix their street name, which was misspelled. On November 20 they edit their sign-up in Airtable to add a gate code. At your next import:

- They show under **changed**, with the new gate code.
- The gate code is updated, because you never edited it in the app.
- The street name stays as **you** fixed it, because in-app edits win.
- If a child's letter changed, that letter goes back to "needs review" in Letter cleanup.
- If the address changed (and you hadn't pinned it by hand), the family goes back into the geocoding queue.

Families you added by hand with **Add family** (Entry IDs from 90001) are never marked missing.

## If the import is refused

| Message | What to do |
|---|---|
| No "Entry ID" column … Columns found: … | This isn't the sign-up export. Download it again from the sign-ups table. |
| Duplicate Entry ID … in this file | Two rows share an Entry ID. Fix it in Airtable and download again. |
| Row … has no Entry ID | A row is missing its Entry ID. Fix it in Airtable and download again. |
| An unclosed quoted CSV field needs correction before importing | The file was edited and saved badly. Download a fresh copy instead of editing it. |

After freezing the plan or printing, the app also asks for a reason before accepting an import.

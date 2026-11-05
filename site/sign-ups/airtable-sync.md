---
title: Sync from Airtable
parent: "November: sign-ups"
nav_order: 2
description: "Pull sign-ups straight from Airtable with a read-only token, instead of downloading a CSV."
---

# Sync from Airtable
{: .no_toc }

**Who:** coordinator.
**When:** instead of, or as well as, [importing the CSV]({{ '/sign-ups/import-csv/' | relative_url }}).

1. TOC
{:toc}

{: .why }
About 160 children's drawings printed as raw web links in 2025, and cleaners pasted about 120 pictures in by hand. Airtable's links to uploaded files expire within hours, so a CSV downloaded on Monday can't fetch drawings on Tuesday. With a sync, the app reads Airtable directly, and when a drawing's link has expired it asks Airtable for a fresh one by itself.

Syncing gives exactly the same "Review your import" preview and the same safe merge as a CSV import. It only ever **reads** from Airtable.

## Set it up once

You need a read-only Airtable token and two IDs.

### 1. Make a read-only token in Airtable

1. Sign in to Airtable and go to [airtable.com/create/tokens](https://airtable.com/create/tokens) (in Airtable's menus: **Builder hub** ▸ **Personal access tokens**). Click **Create token**.
2. Name it "Operation Santa (read-only)".
3. Add one scope: `data.records:read`.
4. Under access, add only the Operation Santa sign-ups base.
5. Create it and copy the token. It starts with `pat`.

### 2. Save the token in the app

1. Go to **Settings**. Find "Airtable connection" on the right.
2. Paste the token into "Personal access token".
3. Click **Save token**. The badge changes to "Token saved".

The token goes into this computer's keychain only, never into the season file. To take it off this computer, click **Remove**.

### 3. Tell the app which table to read

1. Open the sign-ups table in Airtable in a web browser. The address looks like `airtable.com/appXXXXXXXX/tblYYYYYYYY/…`.
2. In **Settings** ▸ "Airtable (read-only)", put the part starting with `app` in "Base ID (app…)".
3. Put the part starting with `tbl` (or the table's name) in "Table ID or name".
4. Click **Save settings** at the bottom of the settings form.

<!-- screenshot: Settings with the Airtable connection panel showing "Token saved" (no real token visible) -->

## Sync

1. Go to **Families**.
2. Click **Sync Airtable**. A message counts records as they're read: "Reading Airtable… 300 records".
3. The "Review your import" box opens. Review and click **Accept import**, as for a [CSV import]({{ '/sign-ups/import-csv/' | relative_url }}#review-the-import).

## Differences from a CSV import

- **No missing-column warning.** Airtable leaves empty fields out of what it sends, so the app can't tell a hidden column from an empty one.
- **Expired drawing links fix themselves.** If a download fails because the link expired, the app looks the family up in Airtable and tries the fresh link.

## If it doesn't work

| Message | What to do |
|---|---|
| Enter the Airtable base ID (app…) and table ID or name in Settings. | Do step 3 above. |
| Connect Airtable in Settings first. | Do step 2 above. |
| Airtable request failed (401) or (403) … | The token is wrong, expired, or doesn't have access to this base. Make a new one with `data.records:read` and this base. |
| Airtable request failed (404) … | The base ID or table is wrong. Copy them again from the browser's address bar. |
| Open an encrypted season first. | Open your season; sync doesn't work in the demo. |

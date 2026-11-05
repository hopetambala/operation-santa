---
title: Troubleshooting
parent: Reference
nav_order: 5
description: "What the app's messages mean and what to do."
---

# Troubleshooting
{: .no_toc }

Red banners at the top of the page explain what went wrong. Find the message below.

1. TOC
{:toc}

## Season files

| Message | What to do |
|---|---|
| Incorrect passphrase or damaged season file. | Check the passphrase in the club's password manager. Passphrases are case-sensitive. If it's right, try the latest [backup]({{ '/start-here/season-file/' | relative_url }}#restore-a-backup). |
| This season is already open in another app. Close it there first. | Someone (maybe you, in another window or on another computer) has the file open. Close it there. |
| Season file not found. | The file was moved or renamed. Use **Open encrypted season** and find it again. |
| A file already exists at this location. Choose a new name. | Pick a different file name when creating a season or saving a packet. |
| This season was created by a newer version of Operation Santa. | [Update the app]({{ '/start-here/install/' | relative_url }}#updates). |
| Saving failed. Keep the app open and use Save now in Settings before closing. | Don't close the app. Free some disk space, then use Settings ▸ **Create encrypted backup**. |
| Automatic backup failed. Check free disk space. | Free some disk space. |
| Season locked after 30 minutes of inactivity. Open it again to continue. | Normal. Open the season again. |
| Encrypted season files and real imports run in the desktop app. | You're in the developer preview, not the installed app. |

## Importing and Airtable

| Message | What to do |
|---|---|
| Create or open an encrypted season before importing family records. | Imports don't work in the demo. [Create or open the season]({{ '/start-here/season-file/' | relative_url }}). |
| No "Entry ID" column in … | Download the export from the sign-ups table again. |
| This export has no column for … | The Airtable view is hiding fields. Use a view that shows them all. |
| Duplicate Entry ID … in this file. | Fix the duplicate in Airtable and download again. |
| Enter the Airtable base ID (app…) and table ID or name in Settings. | See [Sync from Airtable]({{ '/sign-ups/airtable-sync/' | relative_url }}). |
| Connect Airtable in Settings first. | Save the read-only token in Settings. |
| Airtable request failed (401/403/404) … | Check the token's scope and base access, and the base and table IDs. |

## Uploads

| Message | What to do |
|---|---|
| Link expired. Download a fresh CSV from Airtable and import it again; drawings download right after. | Do exactly that. |
| HEIC photo could not be decoded here. Ask the family for a JPEG. | Ask the family, or **Skip upload (print placeholder)**. |
| Letter submitted online. Paste the text into the cleaned letter. | Open the link in the original letter, copy the text, and paste it into "Cleaned letter". |
| Attachment is larger than 30 MB. | Ask the family for a smaller file, or skip it. |
| A converted drawing is missing. Re-run downloads in Letter cleanup. | Letter cleanup ▸ **Retry failed** or **Download uploads**. |

## Geocoding and routes

| Message | What to do |
|---|---|
| Geocoded …: … not found. | Fix those families on the **Addresses** tab. |
| … families could not fit within the hard limit. Add teams or raise the limit. | See [When families don't fit]({{ '/routing/route-planner/' | relative_url }}#when-families-dont-fit). |
| Unfreeze the plan before rebalancing. | The plan is frozen on purpose. Insert or move families instead, or unfreeze with a reason. |
| Unlock both routes before moving stops. / Unlock the route first. | Click **Unlock** on the route. |
| Unpin this building before moving it. | Click the pin icon next to the stop. |
| Out-of-area families go only on special routes. | Put them on a special route, or mark them **Include anyway** in Address review. |
| A reason is required after printing or freezing. | Choose a reason in the box that appears. |

## Printing

| Message | What to do |
|---|---|
| Buttons greyed out in the Print center | Something blocks printing. Click **Show details** under "Check before printing". |
| Labels don't line up | Print the [alignment test]({{ '/printing/labels/' | relative_url }}) at 100% / actual size. |
| Emoji missing from a letter | The print font can't draw emoji, so they're left out on purpose. |
| No pickup families yet. | Nobody's delivery is set to pickup. |

## Updates

| Message | What to do |
|---|---|
| Updates are paused until December 27 so nothing changes during delivery week. | Normal from December 20 to 26. |
| You have the latest version. | Nothing to do. |

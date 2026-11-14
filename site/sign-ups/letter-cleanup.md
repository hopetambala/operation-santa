---
title: Letter cleanup
parent: "November: sign-ups"
nav_order: 5
description: "Look at the letters the app flags, and make sure every drawing will print."
---

# Letter cleanup
{: .no_toc }

**Who:** letter cleaners (in a [cleanup packet]({{ '/sign-ups/cleanup-packets/' | relative_url }}) or on the coordinator's computer); coordinator for uploads.
**When:** from the first import until printing. A route can't print while one of its letters still needs a look.

1. TOC
{:toc}

{: .why }
In 2025 the letters were merged into big Word files, split three ways by Entry ID, and cleaned by hand in parallel. About 160 drawings printed as raw web links, and cleaners pasted about 120 pictures in one by one. The app downloads and converts every drawing as soon as it's imported, and shows each letter next to its drawings.

For 2026 the letters are cleaned outside the app, in Airtable and with a hand check of the printed pages. So the app trusts the imported text: a letter prints as it was imported unless the app flags it.

## Uploads: drawings and uploaded letters

The top of the page shows:

- "UPLOADS": how many are ready to print, out of how many.
- "DOWNLOADING · FAILED · BY HAND": still downloading, failed, and ones a person needs to handle.

What happens to each kind of upload:

| Upload | What the app does |
|---|---|
| Photo or picture (JPEG, PNG, WebP, GIF, HEIC) | Turned into a print-ready picture. |
| PDF | The first four pages become pictures. |
| Word document | Its text is added under the letter as "[from uploaded document]". |
| Google Docs link | Can't be downloaded. Marked "Letter submitted online. Paste the text into the cleaned letter." |

Buttons:

- **Download uploads** starts any that haven't started. This normally happens by itself after an import.
- **Retry failed** tries the failed ones again.

The **Uploads to check** tab lists every child with an upload that isn't ready. For each failed upload you can click **Retry**, or **Skip upload (print placeholder)**: the letter then prints "Letter submitted online — ask the coordinator" where the drawing would be.

{: .note }
Some iPhone photos (HEIC) can't be decoded on every computer: "HEIC photo could not be decoded here. Ask the family for a JPEG." If a link has expired, import a fresh CSV from Airtable and the drawing downloads again.

## Look at the flagged letters

A letter **needs a look** when:

- it contains a phone number, email address or web link;
- it's longer than the limit (1,500 characters);
- it's empty and has no drawing;
- its upload failed, or can't be shown (a Google Docs link, for example);
- or someone clicked **Flag** on it.

Every other letter counts as read and prints as imported.

1. Go to **Letter cleanup**. The first tab says how many letters need a look, for example "6 to look at", and shows them one at a time: "Ana's letter · Rivera A · Entry #26001 · 1 of 6".
2. On the left: the **original letter**, the child's **gift wishes** (first and second choice, age), and any drawings.
3. On the right, under "A careful final read", is the "Cleaned letter" box, with the warning that flagged it. Edit it if needed.
4. Choose one:
   - **Looks good · next**: the text in the box is what prints. The next letter appears.
   - **Don't print**: this letter won't print. The packet says "Letter held by coordinator." in its place.
   - **Flag**: save your edits and keep it in the list for the coordinator.
   - **Next letter** / **Previous**: move without deciding.

When the list is empty, the page says "Nothing to look at".

![A demo letter: the original on the left, the cleaned letter on the right]({{ '/assets/images/letter-cleanup.png' | relative_url }})

### What to change, and what to leave

Keep the child's voice: spelling, grammar and the way they write are part of the letter. Correct only what needs care:

- Remove phone numbers, email addresses and web links. The app warns: "This letter contains a phone number, email, or link."
- Remove anything private that a volunteer shouldn't read.
- Very long letters get a warning ("is over 1500 characters"). Shorten them only if they really won't fit.
- An empty letter with no drawing gets "is empty". Check whether the child sent a drawing, or ask the coordinator.

The app records who reviewed each letter and when ("Last reviewed by …"). Set your name in Settings ▸ "Your display name" first.

## The tabs

| Tab | Shows |
|---|---|
| N to look at | Letters the app flags (see above). |
| Uploads to check | Children whose uploads aren't ready. |
| Looked at | Letters someone marked **Looks good**, to re-read or change. |
| Not printing | Letters marked **Don't print**. |
| All letters | Everything, including letters that print as imported. To flag one, open it here and click **Flag**. |

## Held letters and "do not share with volunteers"

Two ways to keep something away from the Santa teams:

- **Don't print** on one child's letter.
- The **do not share with volunteers** flag on the whole family (in [Families]({{ '/sign-ups/families/' | relative_url }})). The family's letter page in the team packet then says only "Letter held by coordinator. Ask the North Pole before delivering this family's gifts.", and their bag labels say "See coordinator".

The coordinator prints all of these in one PDF with Print center ▸ **Coordinator holds**. See [Pickup event packet and coordinator holds]({{ '/printing/pickup-event/' | relative_url }}).

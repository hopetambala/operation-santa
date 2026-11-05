---
title: Cleanup packets
parent: "November: sign-ups"
nav_order: 6
description: "Share batches of letters with volunteer cleaners as small encrypted files, and merge their work back."
---

# Cleanup packets
{: .no_toc }

**Who:** coordinator (sends and merges); letter cleaners (open, clean, send back).
**When:** whenever there are letters waiting, until about a week before printing.

1. TOC
{:toc}

{: .why }
In 2025 several people cleaned letters at once by splitting a Word file by Entry ID range, then the pieces had to be put back together by hand. A **cleanup packet** is a small encrypted file holding only the letters, gift wishes and drawings for the families you choose. Cleaners never need the season file or its passphrase, and their edits merge back field by field.

A packet contains each family's name, route and children's letters, wishes and drawings. It doesn't contain addresses, phone numbers or emails.

## For the coordinator: send a packet

1. Go to **Letter cleanup** and click **Cleanup packet**.
2. Choose which families go in it:
   - "From Entry ID" and "To Entry ID" (for example 26001 to 26199), or leave them blank for first and last, and/or
   - "Only route (optional)" for one route.
3. Type a "Packet passphrase" (at least 10 characters). Use a different one from the season's.
4. Click **Choose where to save**. The suggested name is like `Cleanup 26001-26199.opsanta-packet`.
5. Send the file to the cleaner (email or a shared drive is fine; it's encrypted). **Send the passphrase a different way**, for example by text message or phone call.

You can keep working on the same letters while the packet is out. If you both change the same letter, you choose which to keep when it comes back.

## For letter cleaners: clean a packet

1. [Install the app]({{ '/start-here/install/' | relative_url }}) if you haven't.
2. Go to **Settings**, put your name in "Your display name", and click **Save settings**. Your name goes on every letter you review and on the file you send back.
3. Click the **avatar** at the top right (or use Settings), then **Open a cleanup packet**.
4. Type the "Packet passphrase" the coordinator gave you and click **Choose packet file**. Pick the `.opsanta-packet` file.
5. The app opens in **packet mode**: the top right says "Cleanup packet · not a season file", and you see only that packet's letters, on the Letter cleanup page.
6. Read and approve, flag or hold each letter. See [Letter cleanup]({{ '/sign-ups/letter-cleanup/' | relative_url }}#read-and-approve-letters).
7. When you're done (or need to stop), click **Save edited packet**, type a packet passphrase, and click **Choose where to save**. The suggested name is like `Cleaned by Ana.opsanta-packet`.
8. Send that file back to the coordinator, and the passphrase separately.

{: .warning }
Packet mode doesn't save as you go. Click **Save edited packet** before you close the app, or your edits are lost.

![Packet mode, with the yellow "Packet mode: you are editing 5 families' letters" note]({{ '/assets/images/packet-mode.png' | relative_url }})

## For the coordinator: merge a returned packet

1. Open your season. Go to **Letter cleanup** and click **Import returned packet**.
2. Type the passphrase the cleaner used and click **Choose packet file**.
3. The app merges the cleaner's changes letter by letter: "14 letter changes merged from Ana. 1 conflicts to resolve."
4. If you and the cleaner both changed the same letter, a box shows **YOURS** and **THEIRS** side by side. Click **Keep mine** or **Take theirs** for each.

Each merged change is recorded in the change log as coming from the cleaner's packet. Only letter text and review state come back; nothing else in the season can be changed by a packet.

| Message | Meaning |
|---|---|
| This packet was made from a different season file. | The packet came from another season (for example last year's or a practice file). |
| This is not an Operation Santa packet. | The file isn't a packet; check you picked the right one. |
| Incorrect passphrase or damaged season file. | The passphrase is wrong. Check with the cleaner. |

---
title: Privacy and what leaves the computer
parent: Reference
nav_order: 4
description: "Where family data lives, what the app sends over the internet, and what volunteers should never share."
---

# Privacy and what leaves the computer
{: .no_toc }

1. TOC
{:toc}

{: .why }
The season holds children's names, letters and drawings, and families' addresses and phone numbers. In 2025 that data sat in exports, Word files and spreadsheets on several laptops, and the routing logins were in plain text in an email. The app keeps it in one encrypted file, sends out only what a service needs, and deletes it after the season.

## Where the data lives

- **The season file** (`.opsanta`) is encrypted with the season passphrase. Without it, the file is unreadable.
- **Backups** are encrypted the same way, kept in the app's own data folder, and deleted by the purge.
- **Cleanup packets** are encrypted with their own passphrase and hold only letters, wishes and drawings.
- **The computer's keychain** (Keychain on a Mac, Credential Manager on Windows) holds the season passphrase only if you ticked "Remember on this computer", and the Airtable token if you saved one. Neither goes in the season file.
- **Exported PDFs and CSVs are not encrypted.** See [Files and formats]({{ '/reference/files/' | relative_url }}).

## What the app sends over the internet

| To | What | When |
|---|---|---|
| US Census geocoder | Street, city, state and ZIP. No names, units, phones or letters. | **Geocode** in Address review |
| OpenStreetMap (Nominatim) | Street, city, state and ZIP of addresses the Census couldn't find | **Geocode** |
| Airtable | Requests to read the sign-ups table, with the read-only token | **Sync Airtable**, and refreshing expired drawing links |
| Airtable's file links | Requests to download each upload | After each import |
| GitHub | A check for a new version | When the app opens, and **Check for updates** (downloaded copies only) |

Nothing else leaves the computer: no names, phone numbers, emails or letters, and no usage tracking.

The **phone links** and the QR codes on each packet's cover are Google Maps links that contain the route's addresses, but no names. Google receives them only when a team lead opens one.

## Rules for volunteers

- Never put real family details in an email, chat, shared document, bug report or screenshot. Use the demo season for screenshots and questions.
- Share a passphrase separately from its file: the file by email or drive, the passphrase by phone or text.
- Keep the season passphrase in the club's password manager, and a sealed copy with the treasurer.
- Lock the season (**avatar** ▸ **Lock now**) when you step away. It locks itself after 30 minutes.
- Shred printed packets after December 26, delete exports, and [purge]({{ '/after-the-season/purge/' | relative_url }}) the season by January 31.

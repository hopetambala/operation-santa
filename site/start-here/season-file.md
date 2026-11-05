---
title: Season files and passphrases
parent: Start here
nav_order: 2
description: "Create, open, lock and back up the encrypted season file."
---

# Season files and passphrases
{: .no_toc }

**Who:** coordinator.
**When:** once before sign-ups open, then every time you open the app.

1. TOC
{:toc}

{: .why }
The season holds children's names, letters and drawings, and families' addresses, phone numbers and gate codes. In 2025 that data was spread across CSV exports, Word files and spreadsheets on several laptops, and the routing logins sat in plain text in an email. Now everything lives in **one encrypted file** (it ends in `.opsanta`). Without the passphrase, the file is unreadable.

## Create the season

1. Click the round **avatar** button at the top right (it shows the first letter of your display name). The "Your season" box opens.
2. Click **Create new season**.
3. In "Season passphrase", type a passphrase of at least 10 characters. A short sentence is easiest to type and hard to guess.
4. Optional: tick "Remember on this computer (system keychain)". Do this only on the coordinator's own computer.
5. Click **Choose save location**, pick a folder and keep the suggested name (for example `Operation Santa 2026.opsanta`), then click **Save**.

The top right now says "Encrypted · saved on this device", and a message says "Encrypted season created. Changes save automatically."

![The "Start a new season" box with the passphrase field and the keychain checkbox]({{ '/assets/images/new-season-dialog.png' | relative_url }})

{: .warning }
**There is no way to recover a season without its passphrase.** Store it in the club's password manager straight away, and give a sealed copy to the treasurer. Don't email it or write it in a shared document.

### Keep the demo instead

If you've set up teams or settings in the demo and want to keep them, choose **Save this demo as a season** in the avatar menu instead of **Create new season**. The fictional families come along too, so this is only useful for practice.

## Open the season

1. Click the **avatar**, then **Open encrypted season** (or Settings ▸ **Open season file**).
2. Choose the `.opsanta` file.
3. If the passphrase is remembered on this computer, the season opens straight away. Otherwise the "Unlock your season" box asks for it: type it and click **Open season**.

If a remembered passphrase no longer works (someone changed the file on another computer, for example), the app asks for the passphrase instead.

## Saving

There's no Save button. Every change is saved within a moment, and the top right shows "Saving…" and then "Encrypted · saved on this device".

{: .note }
If you ever see a red "Saving failed" message, don't close the app: your changes are still in the window. Check free disk space, then choose **Try saving again** on that message. If it keeps failing, tell the coordinator.

## One person at a time

While the season is open, the file is locked to this app. Anyone else who tries to open it, on this computer or another one through a shared drive, sees "This season is already open in another app. Close it there first." Hand the file over by closing the app (or using **Lock now**), not by opening it in two places.

## Locking

- **Lock now**: click the **avatar**, then **Lock now**. The season closes and the app shows the demo again.
- **Automatic lock**: after 30 minutes without a click or a key press, the season locks itself and says "Season locked after 30 minutes of inactivity. Open it again to continue."

Lock the season whenever you step away from a shared computer.

## Backups

The app keeps encrypted backup copies of the season in its own data folder:

- every 15 minutes while the season is open,
- just before each import, geocoding run, rebalance, returned cleanup packet and purge,
- whenever you click Settings ▸ **Create encrypted backup**.

It keeps the latest 20. Backups use the same passphrase as the season.

### Restore a backup

There's no restore button yet. To go back to a backup:

1. Close the app.
2. Find the backups folder:
   - **Mac:** in Finder, choose **Go ▸ Go to Folder…** and paste `~/Library/Application Support/org.pasadenajaycees.opsanta/seasons/backups/`
   - **Windows:** paste `%APPDATA%\org.pasadenajaycees.opsanta\seasons\backups\` into the File Explorer address bar.
3. Open the folder inside it with the newest date. The backup files are named by time, newest last.
4. Copy the backup you want to a safe place, such as next to the season file, and give it a clear name like `Operation Santa 2026 restored.opsanta`.
5. Open the app and use **Open encrypted season** on that copy, with the usual passphrase.

## On a new computer

Copy the `.opsanta` file to the new computer (a USB stick or the club's shared drive), install the app, and open the file with the passphrase. Remembered passphrases and the Airtable token stay in each computer's own keychain, so enter them again there.

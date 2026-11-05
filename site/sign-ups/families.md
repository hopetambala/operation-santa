---
title: Families
parent: "November: sign-ups"
nav_order: 3
description: "Find, filter and edit families, add a family by hand, and change many at once."
---

# Families
{: .no_toc }

**Who:** coordinator; route planners for addresses.
**When:** all season.

1. TOC
{:toc}

{: .why }
In 2025 everything about a family's situation lived in one free-text notes column: "confirmed attendance at the pickup event", "duplicate address is fine", "Spanish speaker", "do not give to volunteers". Nothing could filter or route on it. In the app, delivery type, status, RSVP and flags are proper fields, and every edit is recorded with who made it and, after printing, why.

## Find a family

- **Search**: type any part of a name, address, email or Entry ID in "Search name, address, email or Entry ID…".
- **Filter**: the menu next to it shows All families, Home delivery, Pickup, Special delivery, New, Verified, Not on a route, Proposed flags, Missing from latest import, or Cancelled.

The list shows the first 400 matches; narrow the search to see others. The footer counts families and children.

### Reading the table

| Column | Shows |
|---|---|
| ENTRY ID | The form's Entry ID. Families added by hand start at #90001. |
| FAMILY | Name and city, plus "missing from latest import" if the last import didn't include them. |
| KIDS | Number of children. |
| DELIVERY | home, pickup or special. Pickup families also show their RSVP. |
| STATUS | new, verified, routed or cancelled. |
| ROUTE | The route they're on, or —. |
| FLAGS | Short codes: SS Spanish speaker, ET extra toys, AAF adopt-a-family, DNSWV held by coordinator ("do not share with volunteers"). A **?** means proposed flags are waiting. |
| ADDRESS | verified or manual (good to route), or pending, review or failed (needs a look). |

![The Families list on the demo season, with the filter next to the search box]({{ '/assets/images/families-filter.png' | relative_url }})

## Edit a family

1. Click the family's row. Its card opens on **Details**.
2. Change what you need. The main fields:
   - Contact and address: "Family name", "Street address", "Apartment / unit", "City & state", "ZIP code", "Phone", "Email", "Gate code / access notes".
   - "Delivery": **home**, **pickup** or **special**. For pickup, also set "Pickup RSVP".
   - "Status".
   - "Rudolph Route": the form's poverty-level answer. It prints on the letter under this quiet name so the sheet never says "poverty".
   - "Hardship" and "Answer language".
   - Flags: tick spanish speaker, extra toys, adopt a family, do not share with volunteers, duplicate address ok, eaton impacted, paper letter, or include out of area.
   - "Additional information (printed)" and "Special requests (printed)" appear on the family's letter.
   - "Coordinator notes (never printed, never used for routing)" are for the committee only.
   - "Route" moves the family to another route, or "Not on a route".
3. Click **Save family**.

The **Children & letters** tab holds each child's name, age, gender, first and second choice and letter, plus their drawings. **Add child** and **Remove child** are at the bottom. The **History** tab lists every recorded change to this family.

{: .note }
Anything you edit here is kept through later imports, even if the family changes that field in Airtable. If you change the street, city or ZIP, the address goes back into the geocoding queue unless you've ticked "I verified this address and its coordinates".

### Cancelling a family, or moving them to pickup

Set "Status" to **cancelled**, or "Delivery" to **pickup**, and save. The family comes off their route automatically. If that route has already been printed, the app asks for a reason, and the route shows "Needs reprint" in the Print center.

## Add a family by hand

For a family who called or mailed a paper letter instead of using the form.

1. Click **Add family**. A new card opens with the next free Entry ID from #90001.
2. Fill in **Details**. "Family name" is required.
3. Open **Children & letters** and fill in each child. Click **Add child** for more.
4. Click **Add family**.

The new family goes into the geocoding queue like everyone else.

{: .tip }
For a mailed paper letter, tick the **paper letter** flag and type the letter into "Letter to Santa".

## Change many families at once

1. Tick the box at the left of each family, or the box in the header to tick everyone currently shown.
2. A bar appears: "12 selected". Choose one of:
   - **Set status…**
   - **Set delivery…** (setting pickup also sets the RSVP to "waiting")
   - **Add flag…**
   - **Remove flag…**
3. The change applies straight away. Click **Clear** to untick everyone.

A story: the committee decides that every family in a named apartment complex gets extra toys. Search for the complex's street address, tick the box in the header, and choose **Add flag…** ▸ **extra toys**.

## Other buttons

- **Sync Airtable**: see [Sync from Airtable]({{ '/sign-ups/airtable-sync/' | relative_url }}).
- **Fallback CSV**: see [MyRouteOnline fallback]({{ '/printing/myrouteonline-fallback/' | relative_url }}).

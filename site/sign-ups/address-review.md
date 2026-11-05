---
title: Address review
parent: "November: sign-ups"
nav_order: 4
description: "Geocode addresses, fix the ones the map can't find, and sort out duplicates, out-of-area families and proposed flags."
---

# Address review
{: .no_toc }

**Who:** route planner for addresses and pins; coordinator for duplicates, out of area and proposed flags.
**When:** after each import.

1. TOC
{:toc}

The page has four tabs: **Addresses**, **Duplicates**, **Out of area** and **Proposed flags**. Each shows how many are waiting.

## Geocoding: putting every family on the map

{: .why }
Routes can only be planned for families the app can place on a map. In 2025 MyRouteOnline did this inside three separate accounts, and blank address parts printed as "None" in about 212 addresses. The app looks addresses up itself, accepts the confident matches, and puts only the doubtful ones in front of a person.

1. Go to **Address review**. The top shows "WAITING FOR GEOCODING" with a count.
2. Click **Geocode** followed by that number (for example **Geocode 120**).
3. Wait. The app first checks addresses it has already looked up, then sends the rest to the US Census geocoder ("Sending 120 addresses to the US Census geocoder…"), then tries OpenStreetMap for any the Census missed.
4. A message sums it up: "Geocoded 120: 0 from cache, 112 Census, 5 OpenStreetMap, 3 not found."

Confident matches inside the service area are accepted automatically. Everything else stays on the **Addresses** tab.

{: .note }
Only the street, city, state and ZIP leave the computer, never names, unit numbers, phone numbers or letters. The badge "Only street, city and ZIP are sent" is a reminder.

## Fix the addresses that need a person

The **Addresses** tab lists families the map couldn't place confidently: misses, low-confidence matches, and matches outside the service area.

1. Click a family on the left. The map on the right shows where the app thinks they are.
2. If there's a yellow "Geocoder suggestion" and it's the right place, click **Accept suggestion**.
3. If the address itself is wrong (a typo, the unit in the street field), click **Edit address**, fix it, and click **Save family**. The family is looked up again next time you geocode.
4. If the address is right but the pin is wrong, put the pin where the front door is:
   - click that spot on the map, or
   - type or paste the coordinates into "Latitude" and "Longitude".
5. Click **Pin is right**.

**Pin is right** marks the address as checked by a person. Later imports never move that pin, and a "new" family becomes "verified".

![The Addresses tab with one demo family selected, the map, and the Pin is right button]({{ '/assets/images/address-review.png' | relative_url }})

{: .tip }
To get coordinates from Google Maps: right-click the house, then click the two numbers at the top of the menu to copy them. Paste the first number into "Latitude" and the second into "Longitude". **Copy coordinates** does the reverse, so you can paste the app's pin into a map to check it.

## Duplicates

{: .why }
In 2025 at least one family signed up twice, and the notes column had to say "duplicate address is fine" for different families who share a house. Without a check, a family can get two visits, or one of two households gets missed.

The **Duplicates** tab groups sign-ups that share the same address and unit. For each group, decide:

- **Merge into #…**: it's the same family twice. The second sign-up's children who aren't already on the first are added to the first, and the second is cancelled.
- **Cancel this one**: cancel this sign-up without moving anything.
- **Keep both (different families)**: two households at one address. The app asks why, and records it in the change log. They're marked "duplicate address ok" and stop appearing here.

The app always asks for a reason for merges and cancellations here, so the History explains it later.

A story: the Santos family signs up on November 4 with two children, then again on November 18 with three, because they forgot their youngest. Click **Merge into #26031** on the second sign-up. The third child moves onto the first sign-up, and the second sign-up is cancelled.

## Out of area

{: .why }
In 2025, a few routes drove a long way for just one or two families outside Pasadena. Those routes cost a team a whole evening for very few visits.

The **Out of area** tab lists home-delivery families outside the service area: the cities in Settings ▸ "Cities served" plus "Buffer beyond city limits (miles)". For each, choose:

- **Move to pickup**: they'll come to the pickup event instead. Their RSVP becomes "waiting".
- **Special delivery**: they'll be handled outside the routes. They won't appear on any route or on the pickup packet.
- **Include anyway**: treat them as in the area. Rebalancing may put them on any route.

A family you leave on this tab can still be delivered: create a [special route]({{ '/routing/route-planner/' | relative_url }}#special-routes) for them, such as an out-of-area run. Rebalancing never puts them on an ordinary route.

{: .note }
The service area is drawn as a circle around each city in Settings, so some addresses in neighbouring cities, such as parts of San Gabriel and Arcadia, count as inside. If one of those families shouldn't be delivered, open them on the Families page and set **Delivery** to pickup or special.

## Proposed flags

{: .why }
In 2025 a family's situation lived in a free-text notes column, and nothing could act on it. The app reads the "Jaycee Notes" and the hardship answer for key phrases and **proposes** flags. Nothing changes until a person confirms.

The **Proposed flags** tab lists each family with their note and the proposals, such as:

| Proposal | Comes from |
|---|---|
| spanish speaker | "Spanish" or "español" in the notes, or form answers given in Spanish |
| extra toys | "extra toy" in the notes |
| adopt a family | "adopt a family" in the notes |
| do not share with volunteers | "do not give … volunteer" in the notes |
| duplicate address ok | "duplicate address is fine" in the notes |
| Move to pickup | "pick up" in the notes, or a hardship answer saying they relocated or can't give a home address |
| RSVP confirmed | "confirmed attendance" in the notes |
| eaton impacted | a hardship answer mentioning the Eaton fire |

For each proposal, click **✓** to accept it or **×** to dismiss it. **Accept all** accepts every proposal on the tab.

{: .warning }
Read the list before you click **Accept all**. A single **Move to pickup** takes a family off the home-visit routes.

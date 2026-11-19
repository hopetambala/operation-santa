---
title: Late changes and the freeze
parent: "December: routes"
nav_order: 3
description: "Fit late sign-ups into the plan without starting over, freeze it before printing, and record why anything changes."
---

# Late changes and the freeze
{: .no_toc }

**Who:** coordinator decides; route planner makes the change.
**When:** from the first draft routes to the morning of December 24.

1. TOC
{:toc}

{: .why }
In 2025, after the route sheets were printed, 12 stops were dropped, 2 added and 1 moved. Those changes lived only in a spreadsheet: the printed packets and the phone-app links were already out of date, teams had to be told separately, and nobody recorded why. In the app, late families slot into the existing plan without reshuffling everyone, a frozen plan can't be rebalanced by accident, every change after the freeze or printing carries a reason, and the Print center shows which packets changed.

## Add late families without starting over

A story: on December 21, after the plan is frozen, the Park family calls the hotline. They missed the form, and the committee agrees to visit them.

1. Add them: **Families** ▸ **Add family** for a phone call, or import or sync again for late form sign-ups.
2. Geocode them in **Address review** (**Geocode 1**), and fix the pin if needed.
3. Go to **Route planner** and click **Insert new families**. (It's there once the plan is frozen. Before the freeze, use **Rebalance unlocked** instead.)
4. If a route has been printed, choose a reason, such as **added late**, and click **Record & continue**.
5. Read the message, for example "1 families inserted."

**Insert new families** puts each waiting family into the unlocked ordinary route where it adds the least time, as long as that route stays within the hard maximum. Every other route stays as it is. A family whose building is already on a route joins that route.

If a family doesn't fit anywhere, the message says so and suggests what to do: "No route has room; the closest, Route 12, already runs 3h 40m. Add a team and rebalance." You can also put them on a route by hand from the unrouted table, or on a special route.

## Take a family off

When a family cancels, or switches to the pickup event:

1. Open the family in **Families**.
2. Set "Status" to **cancelled**, or "Delivery" to **pickup**.
3. Click **Save family**. If their route has been printed, choose a reason, such as **cancelled by family** or **moved to pickup**.

They come off their route at once. The route's packet shows "Needs reprint" in the Print center, and the team lead goes on the [call list]({{ '/printing/reprints/' | relative_url }}).

## Freeze the plan

Freeze the plan when the routes are final, just before printing (about December 19).

1. Go to **Route planner**.
2. Click **Freeze plan**. The badge above the route list changes from "Draft" to "Frozen".

While the plan is frozen:

- **Rebalance unlocked** is replaced by **Insert new families**, so nobody can reshuffle every route by mistake.
- You can still insert late families, move single stops, and edit families.

To unfreeze, click **Unfreeze plan**. Once any route has been printed, the app asks for a reason.

Freezing doesn't by itself ask for reasons. A change asks for a reason once it touches a route whose packet has been printed: changes to families, routes, teams, letters and settings. (Pinning a stop, importing a team CSV and the Print center's label options don't.)

## Reasons

After the freeze, or once a route has been printed, the "Leave a note for the next person" box asks why before each change:

| Reason | Use it when |
|---|---|
| cancelled by family | the family called to cancel |
| no response | the family couldn't be reached to confirm |
| duplicate | it's a second sign-up for the same family |
| moved to pickup | they'll come to the pickup event instead |
| address fix | the address or pin was wrong |
| added late | a family signed up or was approved late |
| rebalanced | routes changed to even out times or teams |
| other | anything else; describe it in a few words |

Reasons appear in the [Change log]({{ '/reference/change-log/' | relative_url }}), in the family's History tab, and, through the reprint list, in what you tell the team lead.

## Then reprint

Any change to a printed route marks it "Needs reprint". See [Reprints and the call list]({{ '/printing/reprints/' | relative_url }}).

---
title: A tour of the app
parent: Start here
nav_order: 3
description: "The top bar, the Overview task list, and the reason prompt you'll see after printing."
---

# A tour of the app
{: .no_toc }

**Who:** everyone who runs the app.

1. TOC
{:toc}

![The whole app window on the demo season's Overview, with the navigation along the top]({{ '/assets/images/overview.png' | relative_url }})

## The top bar

From left to right:

- **The tree logo** goes back to the Overview.
- **The tab icons**: Overview, Families, Address review, Route planner, Teams, Letter cleanup, Print center, Change log and Settings. Only the open tab shows its name; rest the pointer on any icon to see its name. A small number on an icon means something there needs attention: addresses to review, letters to look at, or packets to reprint.
- **The bell** shows a dot while the Overview task list has open items.
- **The save state**: "Encrypted · saved on this device" for a real season, "Demo · synthetic data" for the demo, or "Cleanup packet · not a season file" while a letter cleaner has a packet open.
- **A shortcut button**: **Import families** on the Overview and Families pages, **Plan routes** on most others.
- **The avatar** (your initial) opens "Your season": create, open or lock the season, open a cleanup packet, or go to Settings.

## The Overview

The Overview answers "what's left to do?"

- **Stat cards**: families signed up (home, pickup and special), children and drawings ready, routes planned, and packets ready to print.
- **A progress strip**: how many families are imported, verified, geocoded and routed.
- **Route overview**: the first eight routes, with leave and return times, stops, miles and team. Click one to open it in the Route planner.
- **Task list**: each line is a job with a count. Click it to go to the right page. When its count reaches zero it gets a check mark.

| Task | Goes to |
|---|---|
| Review addresses | Address review |
| Confirm proposed flags | Address review |
| Look at flagged letters | Letter cleanup |
| Fix uploads | Letter cleanup |
| Find a route for everyone | Route planner |
| Assign every route a team | Route planner |
| Reprint changed packets | Print center |

## Messages

- **Green messages** at the bottom of the window confirm something worked. They disappear after a few seconds; click **×** to close one sooner.
- **Red banners** at the top of the page say something went wrong and what to do. They stay until you close them. See [Troubleshooting]({{ '/reference/troubleshooting/' | relative_url }}).

## "Leave a note for the next person"

Once a route's packet has been printed, the app asks why before it accepts a change that touches that route. Changes to routes that haven't been printed yet never ask, even when the plan is frozen.

1. Choose a reason: cancelled by family, no response, duplicate, moved to pickup, address fix, added late, rebalanced, or other.
2. For **other**, describe the change in a few words.
3. Click **Record & continue**.

The reason goes into the [Change log]({{ '/reference/change-log/' | relative_url }}) and the family's History, so whoever picks up the work later knows what happened.

{: .why }
In 2025, twelve stops were dropped, two added and one moved after the route sheets were printed, and none of the reasons were written down. On Christmas Eve, nobody could tell a team lead why a family was missing from their sheet.

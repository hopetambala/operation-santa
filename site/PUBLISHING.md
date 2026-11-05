# Publishing the guides (maintainers)

This folder is the GitHub Pages site for `hopetambala/operation-santa`, live at https://hopetambala.github.io/operation-santa/ since 2026-11-05 (Hope's go). Every push to `main` that changes `site/` republishes it. This file and `FEATURE-INVENTORY.md` are excluded from the site build.

## What's here

```text
site/
  _config.yml            Jekyll config: Just the Docs theme, baseurl, callouts, excludes
  _sass/custom/custom.scss  slightly larger body text for older readers
  Gemfile                local preview only
  index.md, roles.md     home page and "Guides by role"
  start-here/            install and update, season files, tour
  sign-ups/              November: import, Airtable sync, families, address review, letter cleanup, cleanup packets
  routing/               December: teams, route planner, late changes and the freeze
  printing/              Dec 19: print center, labels, reprints, pickup packet and holds, MyRouteOnline fallback
  christmas-eve/         team lead packet guide, the North Pole
  after-the-season/      purge
  reference/             settings, change log, files, privacy, troubleshooting, glossary
  FEATURE-INVENTORY.md   maintainers: every feature, its code, its users, its test, its guide
  PUBLISHING.md          this file
```

Screenshot spots are HTML comments: `<!-- screenshot: … -->`. Take them from the **demo season** only (fictional families), never from a real season. Put them in `site/assets/images/` and replace each comment with `![alt text]({{ '/assets/images/name.png' | relative_url }})`. Drafting notes are also comments (`<!-- draft: … -->`) or callouts that start with "**Draft:**"; resolve them all before publishing.

## Theme: Just the Docs

[Just the Docs](https://just-the-docs.com/) v0.12.0 (January 2026), loaded as a remote theme, because it gives:

- a left-hand navigation that mirrors the season's order (`nav_order`, `parent`, `has_children` in each page's front matter);
- built-in search, so a volunteer can type "labels" or "passphrase";
- callouts, used for **Why this step exists** (`{: .why }`), notes, tips and warnings;
- a clean, high-contrast default that reads well for older volunteers.

It works with GitHub's own Pages build (`jekyll-remote-theme` is on GitHub's plugin allowlist).

## Turning on Pages

GitHub Pages can only serve a branch's root or a `/docs` folder directly, and `/docs` already holds the internal engineering notes. So the site needs a small workflow that builds `site/` and deploys it. **Each step below needs Hope's go.**

1. **Decide what's public.** The repo is already public, so `docs/` (problems log, release notes, audit, usability guide) is already visible on GitHub. Pages only publishes what's in `site/`.
2. **Add the workflow** `.github/workflows/pages.yml` (proposed below), commit it with `site/`, and push to `main`.
3. **Turn on Pages:** on GitHub, open the repo ▸ **Settings** ▸ **Pages**. Under "Build and deployment" ▸ "Source", choose **GitHub Actions**. Or from a terminal:
   ```bash
   gh api -X POST repos/hopetambala/operation-santa/pages -f build_type=workflow
   ```
4. Run the workflow (it runs on each push that touches `site/`, or from **Actions ▸ Pages ▸ Run workflow**).
5. The site appears at **https://hopetambala.github.io/operation-santa/**. Optionally set it as the repo's website: `gh repo edit hopetambala/operation-santa --homepage https://hopetambala.github.io/operation-santa/`.

### Proposed `.github/workflows/pages.yml`

Actions are pinned to commit SHAs, like `release.yml`. All were released more than two weeks before 2026-11-04.

```yaml
name: Pages

on:
  push:
    branches: [main]
    paths: ["site/**", ".github/workflows/pages.yml"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0
      - uses: actions/jekyll-build-pages@44a6e6beabd48582f863aeeb6cb2151cc1716697 # v1.0.13
        with:
          source: ./site
          destination: ./_site
      - uses: actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346 # v5.0.1
```

## Preview locally

Needs Ruby and Bundler.

```bash
cd site
bundle install
bundle exec jekyll serve --baseurl /operation-santa
```

Then open http://127.0.0.1:4000/operation-santa/.

## Keeping the guides true

- Button labels in the guides are copied from the app's source. When a label changes in `apps/desktop/src/`, search `site/` for the old label.
- `FEATURE-INVENTORY.md` maps every feature to its guide. Update it when a feature is added or cut.
- Features cut on 2026-10-30 (Dispatch, sweep route, scenarios, route split, next season, post-season report, Circuit export, team-count sweep, Outreach) must not appear in the guides.
- Examples use fictional families only (the demo season's names, Entry IDs 26001 and up). Never real 2025 or 2026 data, and never volunteers' real names.

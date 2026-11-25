# Marin Pulse

Marin Pulse describes how the County of Marin is organized: its departments and divisions, the service areas and programs they run, and the districts, cities, communities and facilities of the County. Every page is generated from the County's shared data in [marin-data](https://github.com/marincountygov/marin-data).

## Structure

- `index.html`: the home page, with a card for each collection
- `organization/`: County departments, divisions and other bodies, one page each, generated from schemaGov JSON-LD, with `data/` (copies from marin-data), `links.json`, and `page-data.js`
- `service-areas/`: the County's service areas, a page each listing its programs
- `programs/`: a page for each program. Both are written by `scripts/build-organization.js` from the same data
- `places/`: the County's places, a page each: supervisorial districts, cities and towns, unincorporated communities and facilities, plus the county
- `projects/`: the County's projects, a page each, built from the entries of marin-data's `projects/projects.json` marked `pulse` (the file is copied to `projects/data/`; a campaign or event series is left out). A project page has an Engage tab (its Engage Marin campaigns and their questions, from marin-data's `engage/campaigns.json`, copied to `engage/data/`) and the Mentions tab for the app the project names
- `scripts/`: the generator (`build-organization.js`) and its helpers
- `vendor/`: the installed MarinOS App Shell (`vendor/marinos/`) and its fonts and icons

Standard operating procedures and guides are in [Marin Docs](https://github.com/marincountygov/marin-docs). Marin Pulse and Marin Docs used to be one app; the old addresses under Marin Docs forward here.

## Build

```text
node scripts/build-organization.js ../marin-data/output
```

Never edit a generated page. Change the data in marin-data, or the generator, and build again.

## Organization

`organization/` is built from schemaGov JSON-LD, not written by hand. The data is `organization/data/organizations.jsonld` and `jurisdictions.jsonld`, copied from `marin-data/output/`, where the organization list is maintained (see `marin-data/FINDINGS.md`). Run `node scripts/build-organization.js ../marin-data/output` to copy new data in and rewrite `organization/index.html` and one page per organization. Edit the data, never the generated pages. Hierarchy comes only from each organization's `parentOrganization`.

An organization page opens on a Dashboard: a tight look at each of its other tabs (About, Divisions, Programs, Budget, People, Engage, and the Mentions app), each with a link to the tab for more. The tabs follow: About, then the tabs the organization has, then Data. On a page with tabs the Copy, Link and Download buttons sit below the tabs and follow the open tab: they copy and download that tab, files are named for it (`cda-programs.md`), and JSON and CSV are offered only on the tabs that have them; the Dashboard offers only the link. Organization, service area and budget pages have Copy, Link and Download buttons (`scripts/page-actions.js`, wired by the shell); the Dashboard is left out of what they copy. Where a page carries its data (an organization, a service area, the funds and the budget tables) Copy and Download also offer JSON: the page's JSON-LD record, exactly as the data has it (`organization/page-data.js`). Download also offers a CSV for each table a page holds (a department's programs and budget, the budget tables, the funds, the lists of organizations and service areas); the rows are written into the page and turned into a CSV with a byte-order mark by `organization/page-data.js`. Telephone numbers are `tel:` links; a number that is not a whole US number stays plain text.

The data also holds programs, people, posts and roles (`programs.jsonld`, `people.jsonld`, `posts.jsonld`, `roles.jsonld`), copied the same way. A body's page has a Programs tab for the programs it administers (with those of the bodies under it) and a People tab for the seats it holds. Service areas have their own section (`service-areas/`) and no pages under `organization/`; each lists its programs, and every program has a page under `programs/` that links to its agency. The Organization homepage lists the departments, offices and other bodies; divisions are listed on their department's page. Some missions in the data end with the department's address, phone, web address or the department head's name. The build leaves those off the page (`cleanMission` in `scripts/build-organization.js`); the data is not changed, and the fix belongs in the data's source.

## Places

`places/` is built by the same script from the jurisdictions and facilities in marin-data. A place page opens on a Dashboard, then About, then the tabs it has: Places and Facilities (what the place contains, so the county lists every district, city, town and community), People (the supervisor of a district, from the post that represents it), Mentions and Data. A city, town or community shows the supervisorial district or districts it is in (marked partly when it is in more than one), and a district's Places tab lists its cities and towns, communities, areas and regions, from `geoWithin` and `geoOverlaps` in the data. Mentions reads the monitor that the place carries as `local:marin-mentions-monitor-id`. Marin Reach is hidden on MarinOS, so no page has a Reach tab or link: `organization/links.json` has no Reach entry, and the generator would draw one again if it were added back. A page's name is the record's code, its `gs:local` identifier in marin-data (`san-rafael`, `marin-district-3`, `civic-center`, `marin-county`). The code belongs to no one app. Edit the data in marin-data, never the generated pages.

## Budget on organization pages

The Budget and Capital improvement plan pages are in [marin-budget](https://github.com/marincountygov/marin-budget) (https://marincountygov.github.io/marin-budget/). The Budget tab on organization, service area and program pages stays here. It reads the budget files in `../marin-data/output` (`budgets.jsonld`, `budget-lines.jsonld`, `source/budget-display.json`, `funds.jsonld`, `sources.json` and `budget-2025-26/schedules.json`) when `node scripts/build-organization.js` runs; it keeps no copy of them. To read another folder, run `node scripts/build-organization.js <folder with the files>` or set `MARIN_DATA_OUTPUT`. `scripts/budget-data.js` builds the tables and `scripts/budget-2025-org.js` adds the FY 2025-26 Final Budget rows. Links from a Budget tab to a fund page, a schedule or the budget data are absolute links to marin-budget (`BUDGET_SITE` in `scripts/budget-data.js`).

A place's About tab has a Census section that shows what the place's page in Marin Census shows: one table for each topic (Measure, Estimate, Margin of error, Out of), every measure, in the order of `output/statistics/topics.json` (kept in marin-data, `statistics/topics.json`, and shared with Marin Census), then the source and a link to the place in Marin Census. The tables use the same markup and class names as Marin Census (`.place-topic`, `.table-scroll`, `.census-cell`); change both together. A value the Census does not give reads "Not available" with the reason from `statistics/omitted-values.json`. The numbers are read from `output/statistics/` in marin-data when the pages are built, for the places that have a Census area (the county, the cities and towns, and the Census-designated places). A district, an area, a region or a facility has none. A list of facts about a page (the About section) is a `dl.details`, the same as Marin Docs.

## Keeping in step with marin-data

The files in `organization/data/` are copies. `marin-data.lock` names the marin-data commit this app last used, and the Data sync workflow pushes a `data-sync` branch when marin-data changes. See marin-data's README.

## Security

Marin Pulse follows the [MarinOS security standard](https://github.com/marincountygov/marin-digital-standards/blob/main/security/standard.md). See [`SECURITY.md`](SECURITY.md) to report an issue, or the app's own `#security` section for a plain-language summary.


## Run locally

Serve this folder with any static web server, for example `python3 -m http.server 8000`, and open `http://localhost:8000/`.

# Working on this Marin application

## Architecture

This is a static, zero-build MarinOS application whose pages are generated from marin-data. It uses the MarinOS App Shell (installed with `marin-app-shell/scripts/install.sh`, version recorded in `platform.shell` in `marin.yml`) and follows `marin-digital-standards`. See `marin.yml` for this project's owner, status, and platform versions.

## Before making changes

1. Check `marin-ui/docs/components.md` for an existing pattern before writing new CSS or JS.
2. Prefer existing semantic tokens over raw values.
3. Keep the default view immediately functional — info/how-to content belongs in the About tab, not stacked above or alongside the content.

## Before finishing

Run `bash scripts/check.sh` (shell integrity, the button audit, the data copies against marin-data, and `tests/test_generated.py`, which fails when a link or file reference is broken, a page has no single h1, or a record list or tab is incomplete). After changing the generator or its data, run `node scripts/build-organization.js ../marin-data/output`; do not edit the generated pages. Then manually verify against the review checklist in `marin-skills/marin-app-builder/SKILL.md`.

## References

- `marin-ui` — shared components, tokens, app shell: https://github.com/marincountygov/marin-ui
- `marin-digital-standards` — accessibility, content, brand, and product-design requirements: https://github.com/marincountygov/marin-digital-standards
- `marin-skills` — AI workflows for building and reviewing Marin applications, including `marin-app-builder` and `app-maintainer`: https://github.com/marincountygov/marin-skills
- `marin-os` — the MarinOS app directory this project is registered in: https://github.com/marincountygov/marin-os

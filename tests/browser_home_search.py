#!/usr/bin/env python3
"""Browser test of the search box on the Marin Pulse home page (home-search.js, data/search-index.json), served over HTTP
from this repository.

Checks that the box appears when JavaScript runs, that a word finds the County's organizations, programs and places grouped by
kind, that results open pages of this site, that the keyboard works (Down into the list, Up back to the box, Enter opens the
first result, Escape empties the box), that a search with no match offers a way back, and that nothing scrolls sideways at
320 px or logs an error.

Needs Playwright for Python and Chromium:  python3 -m pip install playwright && python3 -m playwright install chromium
Run:  python3 tests/browser_home_search.py
"""
from __future__ import annotations

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
INDEX = json.loads((ROOT / "data/search-index.json").read_text(encoding="utf-8"))


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def wait_until(page, expression, timeout=10000):
    """Poll with evaluate: the page's Content Security Policy refuses the string evaluation wait_for_function does."""
    waited = 0
    while waited <= timeout:
        if page.evaluate(f"() => Boolean({expression})"):
            return
        page.wait_for_timeout(100)
        waited += 100
    raise AssertionError(f"Timed out waiting for: {expression}")


def run(page, base):
    page.goto(base)
    page.wait_for_selector("#home-search:not([hidden])")
    require(page.is_visible("#docs-collections"), "The collections show before anyone searches")
    require(page.inner_text("#home-search-results") == "" and page.inner_text("#home-search-status") == "", "Nothing is listed before a search")
    require(page.locator("label[for='home-search-input']").inner_text() == "Search", "The box has a visible label")

    # A word finds things, grouped by kind, and the collections step aside.
    word = next(e["n"].split()[0] for e in INDEX["entries"] if e["k"] == "Place" and len(e["n"].split()[0]) > 4)
    page.fill("#home-search-input", word)
    wait_until(page, "document.querySelectorAll('#home-search-results li a').length > 0")
    status = page.inner_text("#home-search-status")
    require(" / " in status and "result" in status, f"The count line says how many: {status!r}")
    headings = page.locator("#home-search-results h3").all_inner_texts()
    require(any(h.startswith("Places (") for h in headings), f"Results are grouped by kind: {headings}")
    require(not page.is_visible("#docs-collections"), "The collections step aside while there are results")
    hrefs = page.eval_on_selector_all("#home-search-results li a", "els => els.map(e => e.getAttribute('href'))")
    require(all(not h.startswith("http") for h in hrefs), f"Results open pages of this site: {hrefs[:3]}")

    # The keyboard: Down into the list, Up back to the box.
    page.focus("#home-search-input")
    page.keyboard.press("ArrowDown")
    require(page.evaluate("document.activeElement.closest('#home-search-results') !== null"), "Down moves into the results")
    page.keyboard.press("ArrowUp")
    require(page.evaluate("document.activeElement.id === 'home-search-input'"), "Up returns to the box")

    # Escape empties the box and brings the collections back.
    page.keyboard.press("Escape")
    require(page.input_value("#home-search-input") == "" and page.inner_text("#home-search-results") == "", "Escape empties the box")
    require(page.is_visible("#docs-collections"), "The collections come back")

    # No match: say so and offer the way back.
    page.fill("#home-search-input", "zzzzqqxx")
    wait_until(page, "document.getElementById('home-search-status').textContent.includes('0 results')")
    page.click("#home-search-results a")
    require(page.input_value("#home-search-input") == "" and page.is_visible("#docs-collections"), "All collections clears the search")

    # Enter opens the first result, a page of this site.
    page.fill("#home-search-input", word)
    wait_until(page, "document.querySelectorAll('#home-search-results li a').length > 0")
    first = page.eval_on_selector("#home-search-results li a", "e => e.href")
    page.press("#home-search-input", "Enter")
    page.wait_for_url(first)
    require(page.url.startswith(base) and page.url.endswith(".html"), f"Enter opens the first result: {page.url}")

    # Narrow screen.
    page.set_viewport_size({"width": 320, "height": 700})
    page.goto(base)
    page.wait_for_selector("#home-search:not([hidden])")
    page.fill("#home-search-input", word)
    wait_until(page, "document.querySelectorAll('#home-search-results li a').length > 0")
    require(page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "No horizontal scroll at 320 px")
    page.set_viewport_size({"width": 1200, "height": 800})


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Handler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}/"
    problems = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        for scheme in ("light", "dark"):
            context = browser.new_context(color_scheme=scheme, viewport={"width": 1200, "height": 800})
            # The shell reads the MarinOS catalog and the app's Updates from outside; answer them locally.
            context.route("https://marincountygov.github.io/marin-os/**", lambda r: r.fulfill(status=200, content_type="application/json", headers={"access-control-allow-origin": "*"}, body="[]"))
            context.route("https://api.github.com/**", lambda r: r.fulfill(status=200, content_type="application/json", headers={"access-control-allow-origin": "*"}, body="[]"))
            page = context.new_page()
            page.on("pageerror", lambda e: problems.append(str(e)))
            page.on("console", lambda m: problems.append(m.text) if m.type == "error" and "ERR_" not in m.text and "Failed to load resource" not in m.text else None)
            run(page, base)
            context.close()
        browser.close()
    server.shutdown()
    require(not problems, f"Console or page errors: {problems}")
    print("Marin Pulse home search (light and dark): PASS")


if __name__ == "__main__":
    main()

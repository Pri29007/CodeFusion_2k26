"""
browser.py

Reusable Playwright browser setup so every scheme automation script (and
main.py) launches/closes the browser the same way, instead of duplicating
this logic three times.

Usage:

    from utils.browser import get_browser_and_page

    playwright, browser, page = get_browser_and_page()
    try:
        page.goto("http://localhost:5173")
        ...
    finally:
        close_browser(playwright, browser)
"""

from playwright.sync_api import sync_playwright


def get_browser_and_page(headless: bool = False):
    """
    Launch Chromium and return (playwright, browser, page).

    headless=False by default so you can visually watch the automation run —
    this matches what was asked for in this phase. Set headless=True later
    once everything is reliable and you want it to run silently (e.g. from
    the LangGraph agent in production).

    Returns a 3-tuple: (playwright_instance, browser, page)
    You are responsible for calling close_browser() when done.
    """
    playwright = sync_playwright().start()

    # Chromium is used because it's the most reliable/well-tested browser
    # for Playwright automation. slow_mo adds a small delay between actions
    # so it's easier to visually follow what's happening while headless=False.
    browser = playwright.chromium.launch(headless=headless, slow_mo=150 if not headless else 0)

    page = browser.new_page(viewport={"width": 1280, "height": 900})

    return playwright, browser, page


def close_browser(playwright, browser):
    """Cleanly close the browser and stop the Playwright driver."""
    browser.close()
    playwright.stop()

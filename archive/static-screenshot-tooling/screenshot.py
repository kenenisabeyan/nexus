from playwright.sync_api import sync_playwright
import os

PAGES = ["briefing", "dashboard", "search", "explorer", "timeline", "radar", "trends", "impact", "learning", "assistant"]

os.makedirs("/home/claude/static/png", exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1600, "height": 1000}, device_scale_factor=2)
    for name in PAGES:
        path = f"file:///home/claude/static/html/{name}.html"
        page.goto(path)
        page.wait_for_timeout(150)
        page.screenshot(path=f"/home/claude/static/png/{name}.png")
        print("captured", name)
    browser.close()
print("done")

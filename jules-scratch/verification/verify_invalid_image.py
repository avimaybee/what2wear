
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000/wardrobe")

        # Click the "Add Item" button
        page.click('button:has-text("Add Item")')

        # Upload an image
        page.set_input_files('input[type="file"]', 'tests/fixtures/wooden-plank.jpeg')

        # Wait for the error message to appear
        page.wait_for_selector('text="AI could not detect a clothing item. Please try another image."')

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        context.close()
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

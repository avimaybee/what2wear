from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    time.sleep(5)
    page.goto("http://localhost:3000/wardrobe")
    page.click('button:has-text("Add Item")')
    page.set_input_files('input[type="file"]', 'README.md')
    page.click('button:has-text("Add Item")')
    page.click('button:has-text("Edit")')
    page.click('button:has-text("Save Changes")')
    page.screenshot(path="jules-scratch/verification/verification.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)

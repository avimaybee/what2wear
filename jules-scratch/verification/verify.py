
import asyncio
from playwright.async_api import async_playwright, expect
import random
import string

def random_string(length=10):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            email = f"user_{random_string()}@example.com"
            password = "password"

            # Sign up
            await page.goto("http://localhost:3000/auth/sign-up")
            await page.screenshot(path="jules-scratch/verification/signup-page.png")
            await page.get_by_label("Email").fill(email)
            await page.get_by_label("Password").fill(password)
            await page.get_by_role("button", name="Sign Up").click()
            await page.wait_for_url("http://localhost:3000/onboarding")

            # Onboarding
            await page.get_by_role("button", name="Get Started").click()
            await page.wait_for_url("http://localhost:3000/wardrobe")

            # Add a 'Top' to the wardrobe
            await page.get_by_role("button", name="Add Item").click()
            await page.locator('input[type="file"]').set_input_files('src/app/wardrobe/placeholder.png')
            await page.get_by_role("button", name="Add Item").click()
            await expect(page.get_by_text("Item added successfully")).to_be_visible()

            # Go to the home page and check for the error message
            await page.goto("http://localhost:3000")
            await expect(page.get_by_text("You need to add at least one of each: Bottom, Footwear.")).to_be_visible()

            # Take screenshot
            await page.screenshot(path="jules-scratch/verification/insufficient-items.png")

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())

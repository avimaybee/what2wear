from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # 1. Navigate to the homepage.
            page.goto("http://localhost:3000")

            # 2. Wait for the Virtual Try-On component to be visible.
            # Look for the main heading of the component.
            try_on_heading = page.get_by_role("heading", name="Virtual Try-On")
            expect(try_on_heading).to_be_visible(timeout=10000) # 10 second timeout

            # 3. Check for the 'Generate' button to confirm the component loaded.
            generate_button = page.get_by_role("button", name="Generate Virtual Try-On")
            expect(generate_button).to_be_visible()

            # 4. Take a screenshot of the entire component area for visual verification.
            # We can target the parent container of the heading.
            component_container = try_on_heading.locator('xpath=./..')
            component_container.screenshot(path="jules-scratch/verification/virtual_try_on_feature.png")

            print("Screenshot captured successfully.")

        except Exception as e:
            print(f"An error occurred during verification: {e}")
            # Take a screenshot of the whole page on error for debugging
            page.screenshot(path="jules-scratch/verification/error_screenshot.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()
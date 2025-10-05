from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # 1. Navigate to the homepage
            page.goto("http://localhost:3000")

            # 2. Wait for the outfit recommender to load and be visible
            outfit_recommender = page.locator("div.bg-white.p-6.rounded-lg.shadow-md")
            expect(outfit_recommender).to_be_visible(timeout=15000) # Increased timeout for model loading

            # 3. Check for the title
            expect(outfit_recommender.get_by_role("heading", name="Your Daily Outfit Pick")).to_be_visible()

            # 4. Check for the feedback buttons
            like_button = page.get_by_role("button", name="Like")
            dislike_button = page.get_by_role("button", name="Dislike")

            expect(like_button).to_be_visible()
            expect(dislike_button).to_be_visible()

            # 5. Take a screenshot
            page.screenshot(path="jules-scratch/verification/feedback_feature.png")
            print("Screenshot taken successfully.")

        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="jules-scratch/verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()
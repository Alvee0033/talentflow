import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def run_test():
    chrome_options = Options()
    chrome_options.add_argument('--headless=new')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=1440,900')
    chrome_options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

    driver = webdriver.Chrome(options=chrome_options)

    try:
        print("[1] Navigating to http://localhost:3002/login ...")
        driver.get("http://localhost:3002/login")
        time.sleep(2)

        # 1. Verify absence of Demo / Preset Cards
        page_source = driver.page_source
        forbidden_strings = [
            "Selected Account Credentials",
            "Select Account Role",
            "Recruiter@123456",
            "Admin@123456",
            "DeptHead@123456",
            "Lead Recruiter",
            "System Admin",
            "Department Head"
        ]

        for s in forbidden_strings:
            assert s not in page_source, f"Forbidden string '{s}' was found in /login HTML!"
        print("[PASS] No demo role cards, preset buttons, or hardcoded credential banners found.")

        # 2. Check Input Fields are Blank
        email_input = driver.find_element(By.ID, "email")
        pass_input = driver.find_element(By.ID, "password")

        assert email_input.get_attribute("value") == "", "Email input must start empty!"
        assert pass_input.get_attribute("value") == "", "Password input must start empty!"
        print("[PASS] Email and password fields mount completely empty (no autofill).")

        # 3. Check for Next.js Hydration Errors or Overlay
        portal_content = driver.execute_script('''
            const portal = document.querySelector('nextjs-portal');
            if (portal && portal.shadowRoot) {
                return portal.shadowRoot.innerHTML;
            }
            return null;
        ''')
        if portal_content:
            assert "Hydration failed" not in portal_content, f"Hydration error detected: {portal_content[:400]}"
            assert "Unhandled Runtime Error" not in portal_content, f"Runtime error detected: {portal_content[:400]}"
        print("[PASS] Zero hydration errors on /login.")

        # Take screenshot of clean login
        driver.save_screenshot("/home/alvee/.gemini/antigravity/brain/367d93bd-7e87-4c14-b59a-1ff92cc38845/clean_login_verified.png")
        print("[SAVED] clean_login_verified.png")

        # 4. Perform Manual Login
        print("[2] Performing manual login...")
        email_input.send_keys("recruiter@talentflow.anwargroup.com")
        pass_input.send_keys("Recruiter@123456")
        driver.find_element(By.XPATH, "//button[@type='submit']").click()

        WebDriverWait(driver, 10).until(lambda d: d.current_url.rstrip("/") == "http://localhost:3002")
        print(f"[PASS] Successfully redirected to dashboard: {driver.current_url}")
        time.sleep(2)

        # 5. Check for Hydration Errors on Dashboard
        portal_content_dash = driver.execute_script('''
            const portal = document.querySelector('nextjs-portal');
            if (portal && portal.shadowRoot) {
                return portal.shadowRoot.innerHTML;
            }
            return null;
        ''')
        if portal_content_dash:
            assert "Hydration failed" not in portal_content_dash, f"Hydration error on dashboard: {portal_content_dash[:400]}"
            assert "Unhandled Runtime Error" not in portal_content_dash, f"Runtime error on dashboard: {portal_content_dash[:400]}"
        print("[PASS] Zero hydration errors on / (dashboard).")

        # 6. Test Page Refresh
        print("[3] Testing page refresh (persistence & rehydration)...")
        driver.refresh()
        time.sleep(2)
        assert driver.current_url.rstrip("/") == "http://localhost:3002", f"Expected dashboard URL after refresh, got: {driver.current_url}"

        portal_content_refresh = driver.execute_script('''
            const portal = document.querySelector('nextjs-portal');
            if (portal && portal.shadowRoot) {
                return portal.shadowRoot.innerHTML;
            }
            return null;
        ''')
        if portal_content_refresh:
            assert "Hydration failed" not in portal_content_refresh, f"Hydration error on reload: {portal_content_refresh[:400]}"
            assert "Unhandled Runtime Error" not in portal_content_refresh, f"Runtime error on reload: {portal_content_refresh[:400]}"
        print("[PASS] Reloaded cleanly with 0 hydration errors and intact session.")

        driver.save_screenshot("/home/alvee/.gemini/antigravity/brain/367d93bd-7e87-4c14-b59a-1ff92cc38845/dashboard_reloaded_clean.png")
        print("[SAVED] dashboard_reloaded_clean.png")
        print("\nALL VERIFICATIONS PASSED 100%!")

    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()

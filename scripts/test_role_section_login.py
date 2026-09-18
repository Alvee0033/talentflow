import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

def run_test():
    chrome_options = Options()
    chrome_options.add_argument('--headless=new')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=1440,900')

    driver = webdriver.Chrome(options=chrome_options)

    try:
        print("[1] Opening http://localhost:3002/login ...")
        driver.get("http://localhost:3002/login")
        time.sleep(2)

        # Check for hydration error
        portal_content = driver.execute_script('''
            const portal = document.querySelector('nextjs-portal');
            if (portal && portal.shadowRoot) {
                return portal.shadowRoot.innerHTML;
            }
            return null;
        ''')
        assert not (portal_content and "Hydration failed" in portal_content), f"Hydration error: {portal_content}"
        print("[PASS] Zero hydration errors on login page.")

        # Check that Role Selection section exists
        page_source = driver.page_source
        assert "Role Selection" in page_source, "Role Selection section missing!"
        assert "Lead Recruiter" in page_source, "Lead Recruiter option missing!"
        assert "TA Head" in page_source, "TA Head option missing!"
        assert "Department Head" in page_source, "Department Head option missing!"
        assert "Interview Panel" in page_source, "Interview Panel option missing!"
        assert "System Admin" in page_source, "System Admin option missing!"
        print("[PASS] All 5 role options rendered in the Role Selection section.")

        # Click on 'Lead Recruiter' role card
        print("[2] Selecting 'Lead Recruiter' role card...")
        recruiter_card = driver.find_element(By.XPATH, "//button[contains(., 'Lead Recruiter')]")
        recruiter_card.click()
        time.sleep(1)

        email_val = driver.find_element(By.ID, "email").get_attribute("value")
        pass_val = driver.find_element(By.ID, "password").get_attribute("value")

        assert email_val == "recruiter@talentflow.anwargroup.com", f"Expected recruiter email, got: {email_val}"
        assert pass_val == "Recruiter@123456", f"Expected recruiter password, got: {pass_val}"
        print(f"[PASS] Role selection successfully populated credentials for: {email_val}")

        # Save screenshot of the role selection section
        driver.save_screenshot("/home/alvee/.gemini/antigravity/brain/367d93bd-7e87-4c14-b59a-1ff92cc38845/login_role_section.png")
        print("[SAVED] login_role_section.png")

        # Submit login
        print("[3] Submitting login as Lead Recruiter...")
        driver.find_element(By.XPATH, "//button[@type='submit']").click()

        WebDriverWait(driver, 10).until(lambda d: d.current_url.rstrip("/") == "http://localhost:3002")
        print(f"[PASS] Successfully redirected to dashboard: {driver.current_url}")
        time.sleep(2)

        # Verify no hydration errors on dashboard
        portal_dash = driver.execute_script('''
            const portal = document.querySelector('nextjs-portal');
            if (portal && portal.shadowRoot) {
                return portal.shadowRoot.innerHTML;
            }
            return null;
        ''')
        assert not (portal_dash and "Hydration failed" in portal_dash), f"Hydration error on dashboard: {portal_dash}"
        print("[PASS] Zero hydration errors on dashboard.")

        # Test reload persistence
        print("[4] Testing reload...")
        driver.refresh()
        time.sleep(2)
        assert driver.current_url.rstrip("/") == "http://localhost:3002"
        print("[PASS] Session persisted cleanly after reload.")

        print("\nALL ROLE SELECTION AND LOGIN TESTS PASSED 100%!")
    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()

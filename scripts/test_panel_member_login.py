import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

def run():
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

        print("[2] Selecting 'Interview Panel' role...")
        panel_card = driver.find_element(By.XPATH, "//button[contains(., 'Interview Panel')]")
        panel_card.click()
        time.sleep(1)

        email_val = driver.find_element(By.ID, "email").get_attribute("value")
        print(f"[INFO] Populated email: {email_val}")

        print("[3] Clicking Sign In to Dashboard...")
        driver.find_element(By.XPATH, "//button[@type='submit']").click()

        WebDriverWait(driver, 10).until(lambda d: d.current_url.rstrip("/") == "http://localhost:3002")
        print(f"[PASS] Successfully logged in and redirected to: {driver.current_url}")
        time.sleep(3)

        # Check browser logs for 401 errors
        logs = driver.get_log('browser')
        error_logs = [l for l in logs if "401" in l['message']]
        assert len(error_logs) == 0, f"Found 401 errors in browser log: {error_logs}"
        print("[PASS] Zero 401 Unauthorized errors encountered during or after login!")

        # Check for error banners in DOM
        error_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'Request failed with status code 401')]")
        assert len(error_elements) == 0, "Found 'Request failed with status code 401' banner in page!"
        print("[PASS] No error banners on the dashboard.")

        driver.save_screenshot("/home/alvee/.gemini/antigravity/brain/367d93bd-7e87-4c14-b59a-1ff92cc38845/panel_member_dashboard_clean.png")
        print("[SAVED] panel_member_dashboard_clean.png")

        # Navigate to /interviews/evaluate
        print("[4] Navigating to Interview Evaluation (/interviews/evaluate)...")
        driver.get("http://localhost:3002/interviews/evaluate")
        time.sleep(2)
        assert driver.current_url.endswith("/interviews/evaluate")
        print("[PASS] Successfully accessed /interviews/evaluate as Interview Panel member!")

        driver.save_screenshot("/home/alvee/.gemini/antigravity/brain/367d93bd-7e87-4c14-b59a-1ff92cc38845/panel_evaluation_screen.png")
        print("[SAVED] panel_evaluation_screen.png")

        print("\nALL INTERVIEW PANEL TESTS PASSED 100%!")
    finally:
        driver.quit()

if __name__ == "__main__":
    run()

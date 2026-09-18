import os
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:3002"
SNAPSHOT_DIR = "/home/alvee/.gemini/antigravity/brain/367d93bd-7e87-4c14-b59a-1ff92cc38845"

def setup_driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1440,960")
    return webdriver.Chrome(options=chrome_options)

def run_test():
    print("=" * 65)
    print("STARTING LOGIN UI & SESSION PERSISTENCE SELENIUM TEST")
    print("=" * 65)
    
    driver = setup_driver()
    wait = WebDriverWait(driver, 15)
    
    try:
        # Step 1: Open /login
        print("\n[STEP 1] Navigating to /login...")
        driver.get(f"{BASE_URL}/login")
        time.sleep(2)
        
        # Verify demo role selection cards do NOT exist
        role_cards = driver.find_elements(By.XPATH, "//*[contains(text(), 'Select Account Role')]")
        assert len(role_cards) == 0, "Demo 'Select Account Role' card should be removed!"
        print("  ✓ Confirmed: Demo role selection cards are completely REMOVED!")
        
        # Verify preset buttons do NOT exist
        preset_buttons = driver.find_elements(By.XPATH, "//*[contains(text(), 'Lead Recruiter') and contains(@class, 'truncate')]")
        assert len(preset_buttons) == 0, "Role preset buttons should be removed!"
        print("  ✓ Confirmed: Role preset quick-fill buttons are completely REMOVED!")
        
        # Verify email and password inputs are EMPTY (no autofill)
        email_input = wait.until(EC.presence_of_element_located((By.NAME, "email")))
        pass_input = driver.find_element(By.NAME, "password")
        
        email_val = email_input.get_attribute("value")
        pass_val = pass_input.get_attribute("value")
        print(f"  ✓ Email input initial value: '{email_val}' (Empty: {email_val == ''})")
        print(f"  ✓ Password input initial value: '{pass_val}' (Empty: {pass_val == ''})")
        assert email_val == "", "Email input should be empty by default (no autofill)"
        assert pass_val == "", "Password input should be empty by default (no autofill)"
        
        snap_login = os.path.join(SNAPSHOT_DIR, "clean_login_page.png")
        driver.save_screenshot(snap_login)
        print(f"  ✓ Saved clean login screenshot: {snap_login}")
        
        # Step 2: Manual credential fill and sign in
        print("\n[STEP 2] Performing manual login...")
        email_input.send_keys("recruiter@talentflow.anwargroup.com")
        pass_input.send_keys("Recruiter@123456")
        
        sign_in_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        sign_in_btn.click()
        
        wait.until(lambda d: "/login" not in d.current_url)
        time.sleep(3)
        print(f"  ✓ Successfully authenticated! Current URL: {driver.current_url}")
        
        # Step 3: Verify authenticated session on Dashboard
        print("\n[STEP 3] Verifying authenticated session elements...")
        user_name_elem = wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Rafiq Ahmed')]")))
        print(f"  ✓ User profile confirmed: '{user_name_elem.text}'")
        
        # Step 4: Reload page and verify session is preserved!
        print("\n[STEP 4] Reloading page (F5 / refresh) to verify session persistence...")
        driver.refresh()
        time.sleep(3)
        
        print(f"  Current URL after reload: {driver.current_url}")
        assert "/login" not in driver.current_url, f"Session lost after reload! Redirected to: {driver.current_url}"
        
        user_after_reload = wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Rafiq Ahmed')]")))
        print(f"  ✓ User session preserved after reload: '{user_after_reload.text}'!")
        
        snap_reload = os.path.join(SNAPSHOT_DIR, "reloaded_session_dashboard.png")
        driver.save_screenshot(snap_reload)
        print(f"  ✓ Saved reloaded session screenshot: {snap_reload}")
        
        # Step 5: Test navigation to another page and reloading there
        print("\n[STEP 5] Navigating to /messages and testing reload...")
        driver.get(f"{BASE_URL}/messages")
        time.sleep(2)
        assert "/messages" in driver.current_url, f"Failed navigating to /messages: {driver.current_url}"
        
        driver.refresh()
        time.sleep(3)
        assert "/messages" in driver.current_url, f"Session lost on /messages after reload: {driver.current_url}"
        print(f"  ✓ Session preserved on /messages after reload! Current URL: {driver.current_url}")
        
        # Step 6: Test navigating back to /login while logged in
        print("\n[STEP 6] Navigating to /login while authenticated...")
        driver.get(f"{BASE_URL}/login")
        time.sleep(3)
        print(f"  Current URL: {driver.current_url}")
        assert "/login" not in driver.current_url, f"Should have redirected away from /login when authenticated, got {driver.current_url}"
        print("  ✓ Successfully redirected away from /login back to dashboard!")
        
        print("\n" + "=" * 65)
        print("ALL AUTH PERSISTENCE & CLEAN LOGIN TESTS PASSED SUCCESSFULLY!")
        print("=" * 65)
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        err_snap = os.path.join(SNAPSHOT_DIR, "auth_test_error.png")
        driver.save_screenshot(err_snap)
        print(f"Error screenshot saved to {err_snap}")
        raise e
    finally:
        driver.quit()

if __name__ == "__main__":
    success = run_test()
    sys.exit(0 if success else 1)

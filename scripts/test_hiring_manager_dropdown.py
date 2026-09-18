import os
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

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
    print("=" * 60)
    print("STARTING HIRING MANAGER & REQUISITION DROPDOWN SELENIUM TEST")
    print("=" * 60)
    
    driver = setup_driver()
    wait = WebDriverWait(driver, 15)
    
    try:
        # Step 1: Login as Recruiter
        print("\n[STEP 1] Logging in as Recruiter (recruiter@talentflow.anwargroup.com)...")
        driver.get(f"{BASE_URL}/login")
        
        email_input = wait.until(EC.presence_of_element_located((By.NAME, "email")))
        pass_input = driver.find_element(By.NAME, "password")
        email_input.clear()
        email_input.send_keys("recruiter@talentflow.anwargroup.com")
        pass_input.clear()
        pass_input.send_keys("Recruiter@123456")
        
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_btn.click()
        
        # Wait until authenticated and redirected away from /login
        wait.until(lambda d: "/login" not in d.current_url)
        time.sleep(2)
        print(f"  ✓ Authenticated successfully! Current URL: {driver.current_url}")
        
        # Step 2: Navigate to /requisitions/new
        print("\n[STEP 2] Navigating to /requisitions/new...")
        driver.get(f"{BASE_URL}/requisitions/new")
        
        # Wait for form elements
        wait.until(EC.presence_of_element_located((By.NAME, "title")))
        time.sleep(2)
        
        # Step 3: Inspect Business Unit Select
        bu_select_elem = wait.until(EC.presence_of_element_located((By.NAME, "businessUnitId")))
        bu_select = Select(bu_select_elem)
        bu_options = [opt.text.strip() for opt in bu_select.options if opt.get_attribute("value")]
        print(f"\n[STEP 3] Business Unit Options ({len(bu_options)} found):")
        for opt in bu_options:
            print(f"  - {opt}")
        assert len(bu_options) > 0, "ERROR: No business unit options loaded!"
        print("  ✓ Business Units loaded successfully!")

        # Step 4: Inspect Department Select
        dept_select_elem = wait.until(EC.presence_of_element_located((By.NAME, "departmentId")))
        dept_select = Select(dept_select_elem)
        dept_options = [opt.text.strip() for opt in dept_select.options if opt.get_attribute("value")]
        print(f"\n[STEP 4] Department Options ({len(dept_options)} found):")
        for opt in dept_options:
            print(f"  - {opt}")
        assert len(dept_options) > 0, "ERROR: No department options loaded!"
        print("  ✓ Departments loaded successfully!")

        # Step 5: Inspect Assigned Recruiter Select
        recruiter_select_elem = wait.until(EC.presence_of_element_located((By.NAME, "assignedRecruiterId")))
        recruiter_select = Select(recruiter_select_elem)
        recruiter_options = [opt.text.strip() for opt in recruiter_select.options if opt.get_attribute("value")]
        print(f"\n[STEP 5] Assigned Recruiter Options ({len(recruiter_options)} found):")
        for opt in recruiter_options:
            print(f"  - {opt}")
        assert len(recruiter_options) > 0, "ERROR: No recruiter options loaded!"
        print("  ✓ Lead Recruiters loaded successfully!")

        # Step 6: Inspect Hiring Manager Select
        manager_select_elem = wait.until(EC.presence_of_element_located((By.NAME, "hiringManagerId")))
        manager_select = Select(manager_select_elem)
        manager_options = [opt.text.strip() for opt in manager_select.options if opt.get_attribute("value")]
        print(f"\n[STEP 6] Hiring Manager Options ({len(manager_options)} found):")
        for opt in manager_options:
            print(f"  - {opt}")
        assert len(manager_options) > 0, "ERROR: No hiring manager options loaded! Hiring Manager dropdown is empty!"
        print("  ✓ Hiring Managers loaded successfully! (NOT EMPTY)")

        # Save snapshot of form with loaded dropdowns
        form_snapshot = os.path.join(SNAPSHOT_DIR, "hiring_manager_dropdown_loaded.png")
        driver.save_screenshot(form_snapshot)
        print(f"  ✓ Snapshot saved: {form_snapshot}")

        # Step 7: Fill out and submit the requisition form
        print("\n[STEP 7] Filling out form with selected Hiring Manager & submitting...")
        
        # Select hiring manager if Nasim Karim is present, or first available
        chosen_hm_index = 0
        for i, opt in enumerate(manager_select.options):
            if "Nasim Karim" in opt.text or "manager@" in opt.text:
                chosen_hm_index = i
                break
        manager_select.select_by_index(chosen_hm_index)
        selected_hm_text = manager_select.options[chosen_hm_index].text
        print(f"  - Selected Hiring Manager: {selected_hm_text}")

        # Select Recruiter
        recruiter_select.select_by_index(0)
        selected_rec_text = recruiter_select.options[0].text
        print(f"  - Selected Recruiter: {selected_rec_text}")

        # Fill title and description
        title_input = driver.find_element(By.NAME, "title")
        title_input.clear()
        req_title = f"Principal Cloud Architect - Automated E2E {int(time.time())}"
        title_input.send_keys(req_title)

        jd_elem = driver.find_element(By.XPATH, "//textarea")
        jd_elem.clear()
        jd_elem.send_keys("Lead multi-cloud infrastructure and DevOps transformations across Anwar Group enterprise units.")

        # Save snapshot before submission
        before_sub_snapshot = os.path.join(SNAPSHOT_DIR, "requisition_before_submit.png")
        driver.save_screenshot(before_sub_snapshot)
        print(f"  ✓ Pre-submit snapshot saved: {before_sub_snapshot}")

        # Submit
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        driver.execute_script("arguments[0].scrollIntoView(true);", submit_btn)
        time.sleep(1)
        submit_btn.click()

        # Step 8: Verify redirect to requisition workspace
        print("\n[STEP 8] Verifying successful creation and redirect to requisition workspace...")
        wait.until(lambda d: "/requisitions/" in d.current_url and "/requisitions/new" not in d.current_url)
        time.sleep(2)
        print(f"  ✓ Redirected to: {driver.current_url}")

        # Verify page content
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert req_title in body_text, f"Requisition title '{req_title}' not found on detail page!"
        print(f"  ✓ Verified requisition title '{req_title}' appears on detail page!")

        # Verify Hiring Manager appears on detail page
        assert "Hiring Manager:" in body_text, "Hiring Manager label not found on detail page!"
        assert "Pending" not in body_text or "Nasim" in body_text or "Tariq" in body_text, "Hiring Manager still says Pending!"
        print("  ✓ Verified Hiring Manager is displayed and linked on the Requisition Workspace!")

        # Save snapshot of created requisition
        after_sub_snapshot = os.path.join(SNAPSHOT_DIR, "requisition_created_with_hiring_manager.png")
        driver.save_screenshot(after_sub_snapshot)
        print(f"  ✓ Created requisition snapshot saved: {after_sub_snapshot}")

        print("\n" + "=" * 60)
        print("ALL HIRING MANAGER & REQUISITION TESTS PASSED SUCCESSFULLY!")
        print("=" * 60)
        return True

    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        error_snapshot = os.path.join(SNAPSHOT_DIR, "test_failure.png")
        driver.save_screenshot(error_snapshot)
        print(f"Error snapshot saved: {error_snapshot}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        driver.quit()

if __name__ == "__main__":
    success = run_test()
    sys.exit(0 if success else 1)

import os
import sys
import time
import json
import urllib.request
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:3002"
API_URL = "http://localhost:3001/api/v1"
SNAPSHOT_DIR = "/home/alvee/.gemini/antigravity/brain/367d93bd-7e87-4c14-b59a-1ff92cc38845"

def setup_driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1440,960")
    return webdriver.Chrome(options=chrome_options)

def get_recruiter_token():
    req = urllib.request.Request(
        f"{API_URL}/auth/login",
        data=json.dumps({
            "email": "recruiter@talentflow.anwargroup.com",
            "password": "Recruiter@123456"
        }).encode(),
        headers={"Content-Type": "application/json"}
    )
    res = urllib.request.urlopen(req)
    return json.loads(res.read().decode())["data"]["accessToken"]

def seed_test_messages(token):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    req = urllib.request.Request(f"{API_URL}/candidates", headers=headers)
    cands = json.loads(urllib.request.urlopen(req).read().decode())["data"]["items"]
    cand = cands[0]
    
    ts = int(time.time())
    draft1_data = {
        "candidateId": cand["id"],
        "channel": "EMAIL",
        "subject": f"Interview Invitation · Round 1 Technical ({ts})",
        "body": f"Dear {cand['firstName']},\n\nYou have been shortlisted for Round 1 Technical Assessment at Anwar Group.\nDate: Friday, 3:00 PM\nFormat: Google Meet\n\nPlease confirm availability."
    }
    req_d1 = urllib.request.Request(f"{API_URL}/messages", data=json.dumps(draft1_data).encode(), headers=headers)
    m1 = json.loads(urllib.request.urlopen(req_d1).read().decode())["data"]
    
    req_app1 = urllib.request.Request(f"{API_URL}/messages/{m1['id']}/request-approval", data=b"{}", headers=headers)
    m1_ready = json.loads(urllib.request.urlopen(req_app1).read().decode())["data"]
    
    print(f"  ✓ Prepared awaiting approval test message: {m1_ready['id']} (Status: {m1_ready['status']})")
    return m1_ready

def run_test():
    print("=" * 65)
    print("STARTING SCREEN 7: MESSAGE APPROVAL QUEUE SELENIUM E2E TEST")
    print("=" * 65)
    
    token = get_recruiter_token()
    test_msg = seed_test_messages(token)
    
    driver = setup_driver()
    wait = WebDriverWait(driver, 15)
    
    try:
        print("\n[STEP 1] Logging in as Recruiter...")
        driver.get(f"{BASE_URL}/login")
        
        email_input = wait.until(EC.presence_of_element_located((By.NAME, "email")))
        pass_input = driver.find_element(By.NAME, "password")
        email_input.clear()
        email_input.send_keys("recruiter@talentflow.anwargroup.com")
        pass_input.clear()
        pass_input.send_keys("Recruiter@123456")
        
        driver.find_element(By.XPATH, "//button[@type='submit']").click()
        wait.until(lambda d: "/login" not in d.current_url)
        time.sleep(2)
        print(f"  ✓ Authenticated! Current URL: {driver.current_url}")
        
        print("\n[STEP 2] Navigating to Message Approval Queue (/messages)...")
        driver.get(f"{BASE_URL}/messages")
        
        screen_title = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "screen-title")))
        assert "Message Approval Queue" in screen_title.text, f"Unexpected title: {screen_title.text}"
        print(f"  ✓ Screen Title: '{screen_title.text}'")
        
        role_pill = driver.find_element(By.CLASS_NAME, "role-pill")
        print(f"  ✓ Role badge: '{role_pill.text}'")
        
        # Wait for communications data to load from API
        wait.until(lambda d: len(d.find_elements(By.CLASS_NAME, "animate-spin")) == 0)
        time.sleep(1)
        
        print("\n[STEP 3] Verifying Pipeline Stepper...")
        pipeline_track = wait.until(EC.presence_of_element_located((By.XPATH, "//*[@data-testid='pipeline-track']")))
        wait.until(lambda d: "active" in d.find_element(By.XPATH, "//*[@data-testid='pipeline-step-awaiting']").get_attribute("class"))
        step_awaiting = driver.find_element(By.XPATH, "//*[@data-testid='pipeline-step-awaiting']")
        step_drafted = driver.find_element(By.XPATH, "//*[@data-testid='pipeline-step-drafted']")
        step_approved = driver.find_element(By.XPATH, "//*[@data-testid='pipeline-step-approved']")
        step_sent = driver.find_element(By.XPATH, "//*[@data-testid='pipeline-step-sent']")
        
        print(f"  ✓ Drafted classes: '{step_drafted.get_attribute('class')}'")
        print(f"  ✓ Awaiting Approval classes: '{step_awaiting.get_attribute('class')}'")
        assert "active" in step_awaiting.get_attribute("class"), "Awaiting Approval step should be active"
        assert "completed" in step_drafted.get_attribute("class"), "Drafted step should be completed"
        
        print("\n[STEP 4] Verifying Approval Actions panel...")
        approve_btn = wait.until(EC.presence_of_element_located((By.XPATH, "//*[@data-testid='approve-send-btn']")))
        reject_btn = driver.find_element(By.XPATH, "//*[@data-testid='reject-edit-btn']")
        assert approve_btn.is_displayed(), "Approve & Send button not visible"
        assert reject_btn.is_displayed(), "Reject / Edit button not visible"
        print(f"  ✓ 'Approve & Send' button is present and visible!")
        print(f"  ✓ 'Reject / Edit' button is present and visible!")
        
        snap1 = os.path.join(SNAPSHOT_DIR, "screen7_message_approval_queue.png")
        driver.save_screenshot(snap1)
        print(f"  ✓ Snapshot saved: {snap1}")
        
        print("\n[STEP 5] Clicking 'Approve & Send' to approve and dispatch...")
        approve_btn.click()
        time.sleep(3)
        
        wait.until(lambda d: "active" in d.find_element(By.XPATH, "//*[@data-testid='pipeline-step-sent']").get_attribute("class"))
        step_sent_updated = driver.find_element(By.XPATH, "//*[@data-testid='pipeline-step-sent']")
        print(f"  ✓ Pipeline Stepper updated! Sent step classes: '{step_sent_updated.get_attribute('class')}'")
        
        delivery_status = driver.find_element(By.XPATH, "//*[@data-testid='delivery-status-text']")
        print(f"  ✓ Delivery status: '{delivery_status.text}'")
        assert "Dispatched and delivered" in delivery_status.text or "secure" in delivery_status.text
        
        snap2 = os.path.join(SNAPSHOT_DIR, "screen7_message_sent_success.png")
        driver.save_screenshot(snap2)
        print(f"  ✓ Snapshot saved: {snap2}")
        
        print("\n[STEP 6] Testing Rejection / Edit flow...")
        m2 = seed_test_messages(token)
        
        driver.refresh()
        wait.until(lambda d: len(d.find_elements(By.CLASS_NAME, "animate-spin")) == 0)
        time.sleep(1)
        
        reject_btn_2 = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[@data-testid='reject-edit-btn']")))
        reject_btn_2.click()
        time.sleep(1)
        
        reason_input = wait.until(EC.presence_of_element_located((By.XPATH, "//*[@data-testid='reject-reason-input']")))
        reason_input.clear()
        reason_input.send_keys("Candidate requested rescheduled time: Monday 11 AM")
        
        confirm_reject_btn = driver.find_element(By.XPATH, "//*[@data-testid='confirm-reject-btn']")
        confirm_reject_btn.click()
        time.sleep(2)
        
        step_drafted_updated = wait.until(lambda d: d.find_element(By.XPATH, "//*[@data-testid='pipeline-step-drafted']"))
        print(f"  ✓ After reject/edit, Drafted step classes: '{step_drafted_updated.get_attribute('class')}'")
        assert "active" in step_drafted_updated.get_attribute("class"), "Drafted step should be active after rejection"
        
        req_approval_btn = wait.until(EC.presence_of_element_located((By.XPATH, "//*[@data-testid='request-approval-btn']")))
        print(f"  ✓ 'Submit for Approval' button is available for edited draft!")
        
        snap3 = os.path.join(SNAPSHOT_DIR, "screen7_message_revision_mode.png")
        driver.save_screenshot(snap3)
        print(f"  ✓ Snapshot saved: {snap3}")
        
        print("\n" + "=" * 65)
        print("ALL TESTS PASSED SUCCESSFULLY! Screen 7 is fully functional!")
        print("=" * 65)
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        err_snap = os.path.join(SNAPSHOT_DIR, "screen7_test_error.png")
        driver.save_screenshot(err_snap)
        print(f"Error screenshot saved to {err_snap}")
        raise e
    finally:
        driver.quit()

if __name__ == "__main__":
    success = run_test()
    sys.exit(0 if success else 1)

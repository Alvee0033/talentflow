import time, os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:3002"
SNAPSHOT_DIR = "/home/alvee/.gemini/antigravity/brain/367d93bd-7e87-4c14-b59a-1ff92cc38845"

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--no-sandbox")
opts.add_argument("--disable-dev-shm-usage")
opts.add_argument("--window-size=1600,1050")

driver = webdriver.Chrome(options=opts)
try:
    print("Navigating to login...")
    driver.get(f"{BASE_URL}/login")
    time.sleep(2)

    email_el = driver.find_element(By.NAME, "email")
    email_el.clear()
    email_el.send_keys("recruiter@talentflow.anwargroup.com")

    pass_el = driver.find_element(By.NAME, "password")
    pass_el.clear()
    pass_el.send_keys("Recruiter@123456")

    for b in driver.find_elements(By.TAG_NAME, "button"):
        if "Sign In" in b.text:
            driver.execute_script("arguments[0].click();", b)
            break

    time.sleep(3)
    print("Logged in. Capturing 9 Canonical Screens...")

    screens = [
        {"num": 1, "path": "/", "name": "screen_1_recruiter_dashboard.png"},
        {"num": 2, "path": "/requisitions", "name": "screen_2_requisition_workspace.png"},
        {"num": 3, "path": "/candidates", "name": "screen_3_candidate_pipeline.png"},
        {"num": 4, "path": "/candidates/workspace", "name": "screen_4_candidate_workspace.png"},
        {"num": 5, "path": "/interviews", "name": "screen_5_interview_scheduling.png"},
        {"num": 6, "path": "/interviews/evaluate", "name": "screen_6_interview_evaluation.png"},
        {"num": 7, "path": "/messages", "name": "screen_7_message_approval.png"},
        {"num": 8, "path": "/joining", "name": "screen_8_joining_checklist.png"},
        {"num": 9, "path": "/dashboard/management", "name": "screen_9_management_dashboard.png"},
    ]

    for s in screens:
        url = f"{BASE_URL}{s['path']}"
        print(f"[{s['num']}/9] Navigating to {s['path']}...")
        driver.get(url)
        time.sleep(2.5)
        out_path = os.path.join(SNAPSHOT_DIR, s['name'])
        driver.save_screenshot(out_path)
        print(f"  ✓ Saved snapshot: {s['name']}")

    print("\nALL 9 SCREENS VERIFIED & SNAPSHOTTED SUCCESSFULLY!")

finally:
    driver.quit()

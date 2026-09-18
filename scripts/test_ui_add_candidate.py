import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--no-sandbox")
opts.add_argument("--disable-dev-shm-usage")
opts.add_argument("--window-size=1600,1000")

driver = webdriver.Chrome(options=opts)
try:
    print("Navigating to login page...")
    driver.get("http://localhost:3002/login")
    time.sleep(2)
    
    # Fill login form
    email_el = driver.find_element(By.NAME, "email")
    email_el.clear()
    email_el.send_keys("recruiter@talentflow.anwargroup.com")
    
    pass_el = driver.find_element(By.NAME, "password")
    pass_el.clear()
    pass_el.send_keys("Recruiter@123456")
    time.sleep(0.5)
    
    for b in driver.find_elements(By.TAG_NAME, "button"):
        if "Sign In" in b.text:
            driver.execute_script("arguments[0].click();", b)
            break

    # Wait for login
    time.sleep(3)
    token = driver.execute_script("return localStorage.getItem('tf_token');")
    print(f"Token present: {bool(token)}, Current URL: {driver.current_url}")

    # Navigate to candidates page
    driver.get("http://localhost:3002/candidates")
    time.sleep(3)

    # Check Add Candidate button
    add_btn = None
    for b in driver.find_elements(By.TAG_NAME, "button"):
        if "Add Candidate" in b.text:
            add_btn = b
            break

    if not add_btn:
        print("FAIL: 'Add Candidate' button NOT found!")
        driver.save_screenshot("/home/alvee/.gemini/antigravity/brain/367d93bd-7e87-4c14-b59a-1ff92cc38845/error_candidates.png")
        exit(1)

    print("SUCCESS: Found 'Add Candidate' button! Clicking it...")
    driver.execute_script("arguments[0].click();", add_btn)
    time.sleep(1)

    modal_header = driver.find_element(By.XPATH, "//h2[contains(., 'Add New Candidate')]")
    print(f"SUCCESS: Modal opened with header: '{modal_header.text}'")

    driver.save_screenshot("/home/alvee/.gemini/antigravity/brain/367d93bd-7e87-4c14-b59a-1ff92cc38845/add_candidate_modal.png")
    print("Screenshot saved to add_candidate_modal.png")
    print("ALL UI VERIFICATION COMPLETE.")

finally:
    driver.quit()

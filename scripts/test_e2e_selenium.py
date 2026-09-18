#!/usr/bin/env python3
"""
TalentFlow Comprehensive E2E Selenium Test Suite
Tests all pages, authentication roles, components, and user workflows.
"""

import sys
import time
import json
import traceback
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:3002"
API_URL = "http://localhost:3001/api/v1"

ROLES_TO_TEST = [
    {
        "role": "Lead Recruiter",
        "email": "recruiter@talentflow.anwargroup.com",
        "pass": "Recruiter@123456",
        "name": "Rafiq Ahmed",
    },
    {
        "role": "System Admin",
        "email": "admin@talentflow.anwargroup.com",
        "pass": "Admin@123456",
        "name": "Tanvir Hasan",
    },
]

PAGES_TO_VERIFY = [
    {
        "path": "/",
        "name": "Executive Dashboard",
        "expected_texts": ["TalentFlow", "Requisition", "Candidate"],
    },
    {
        "path": "/requisitions",
        "name": "Requisition Management",
        "expected_texts": ["Requisitions"],
    },
    {
        "path": "/requisitions/new",
        "name": "Create Requisition",
        "expected_texts": ["Requisition", "Department"],
    },
    {
        "path": "/candidates",
        "name": "Candidate Pipeline / Kanban",
        "expected_texts": ["Candidate"],
    },
    {
        "path": "/candidates/import",
        "name": "Import Candidates",
        "expected_texts": ["Import", "Upload"],
    },
    {
        "path": "/interviews",
        "name": "Interview Coordination",
        "expected_texts": ["Interview"],
    },
    {
        "path": "/tasks",
        "name": "Task Coordination Hub",
        "expected_texts": ["Task"],
    },
    {
        "path": "/messages",
        "name": "Communication Center",
        "expected_texts": ["Message"],
    },
    {
        "path": "/joining",
        "name": "Onboarding & Joining Tracker",
        "expected_texts": ["Joining"],
    },
    {
        "path": "/reports",
        "name": "Recruitment Analytics & Reports",
        "expected_texts": ["Report"],
    },
    {
        "path": "/admin/users",
        "name": "User & Role Administration",
        "expected_texts": ["User"],
    },
    {
        "path": "/admin/roles",
        "name": "Roles & Permissions Matrix",
        "expected_texts": ["Role"],
    },
    {
        "path": "/admin/approval-flows",
        "name": "Approval Workflows",
        "expected_texts": ["Approval"],
    },
    {
        "path": "/admin/organization",
        "name": "Organization Structure",
        "expected_texts": ["Organization", "Department"],
    },
    {
        "path": "/admin/evaluation-forms",
        "name": "Evaluation Scorecards",
        "expected_texts": ["Evaluation", "Form"],
    },
    {
        "path": "/admin/templates",
        "name": "Communication & Document Templates",
        "expected_texts": ["Template"],
    },
    {
        "path": "/settings",
        "name": "System & User Settings",
        "expected_texts": ["Settings", "Account"],
    },
]

def create_driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1600,1000")
    options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    return webdriver.Chrome(options=options)

def test_login(driver, email, password, role_title):
    print(f"\n[TEST LOGIN] Logging in as {role_title} ({email})...")
    driver.get(f"{BASE_URL}/login")
    
    # Wait for document to be ready
    WebDriverWait(driver, 10).until(
        lambda d: d.execute_script("return document.readyState") == "complete"
    )
    time.sleep(2)

    # Click role button if found
    for b in driver.find_elements(By.TAG_NAME, "button"):
        if role_title in b.text:
            driver.execute_script("arguments[0].click();", b)
            time.sleep(1)
            break

    # Fill email and password explicitly to guarantee state
    email_el = driver.find_element(By.NAME, "email")
    email_el.clear()
    email_el.send_keys(email)

    pass_el = driver.find_element(By.NAME, "password")
    pass_el.clear()
    pass_el.send_keys(password)
    time.sleep(0.5)

    # Click submit
    submit_btn = None
    for b in driver.find_elements(By.TAG_NAME, "button"):
        if "Sign In" in b.text:
            submit_btn = b
            break

    if submit_btn:
        driver.execute_script("arguments[0].click();", submit_btn)

    # Wait for token and navigation to /
    for _ in range(12):
        time.sleep(1)
        url = driver.current_url
        token = driver.execute_script("return localStorage.getItem('tf_token');")
        if token and (url.rstrip("/") in [BASE_URL, f"{BASE_URL}/"] or not url.endswith("/login")):
            print(f"  ✓ Successfully authenticated! Token found. URL: {driver.current_url}")
            return True

    print(f"  ✗ Failed to redirect or store token. Current URL: {driver.current_url}")
    return False

def test_page(driver, page_info):
    path = page_info["path"]
    name = page_info["name"]
    expected_texts = page_info.get("expected_texts", [])

    print(f"\n[TEST PAGE] Navigating to '{name}' ({path})...")
    driver.get(f"{BASE_URL}{path}")
    time.sleep(3)

    # Check for client crashes (Next.js error overlay)
    body_text = driver.find_element(By.TAG_NAME, "body").text
    
    # Check if redirected back to /login
    if "/login" in driver.current_url and path != "/login":
        print(f"  ✗ Unauthorized or redirected to login for {path}")
        return False, "Redirected to login"

    if "Application error: a client-side exception has occurred" in body_text:
        print(f"  ✗ Client-side crash on {path}")
        return False, "Client crash"

    if "Unhandled Runtime Error" in body_text:
        print(f"  ✗ Next.js Runtime error on {path}")
        return False, "Runtime error"

    # Check expected texts
    missing_texts = []
    for t in expected_texts:
        if t.lower() not in body_text.lower():
            missing_texts.append(t)

    if missing_texts:
        print(f"  ⚠ Warning: Missing some expected keywords on {path}: {missing_texts}")
        return False, f"Missing {missing_texts}"
    else:
        print(f"  ✓ All expected content keywords found on {path}!")

    # Check for buttons, links, tables
    buttons = driver.find_elements(By.TAG_NAME, "button")
    links = driver.find_elements(By.TAG_NAME, "a")
    tables = driver.find_elements(By.TAG_NAME, "table")
    print(f"  ✓ Rendered elements: {len(buttons)} buttons, {len(links)} links, {len(tables)} tables")

    # Take screenshot for visual record
    clean_name = path.strip("/").replace("/", "_") or "dashboard"
    screenshot_path = f"/home/alvee/.gemini/antigravity/brain/367d93bd-7e87-4c14-b59a-1ff92cc38845/{clean_name}.png"
    driver.save_screenshot(screenshot_path)
    print(f"  ✓ Saved visual snapshot: {screenshot_path}")

    return True, "OK"

def main():
    print("=" * 60)
    print("STARTING TALENTFLOW FULL SELENIUM E2E VERIFICATION")
    print("=" * 60)

    driver = create_driver()
    results = {}

    try:
        # Step 1: Test Login as Recruiter
        recruiter = ROLES_TO_TEST[0]
        login_ok = test_login(driver, recruiter["email"], recruiter["pass"], recruiter["role"])
        if not login_ok:
            print("FATAL: Recruiter login failed.")
            sys.exit(1)

        # Step 2: Test all core pages as Recruiter
        print("\n--- Verifying Core Recruitment Pages ---")
        for p in PAGES_TO_VERIFY:
            ok, msg = test_page(driver, p)
            results[p["path"]] = (ok, msg)

        # Step 3: Test Admin Login and Admin Pages
        admin = ROLES_TO_TEST[1]
        print("\n--- Testing Admin Role Login & Permissions ---")
        admin_login_ok = test_login(driver, admin["email"], admin["pass"], admin["role"])
        if admin_login_ok:
            for p in [p for p in PAGES_TO_VERIFY if p["path"].startswith("/admin")]:
                ok, msg = test_page(driver, p)
                results[f"admin:{p['path']}"] = (ok, msg)

        # Print summary
        print("\n" + "=" * 60)
        print("TALENTFLOW TEST SUMMARY RESULTS")
        print("=" * 60)
        passed = 0
        failed = 0
        for path, (ok, msg) in results.items():
            status = "PASS" if ok else "FAIL"
            if ok:
                passed += 1
            else:
                failed += 1
            print(f"[{status}] {path:30} : {msg}")

        print(f"\nTotal: {passed + failed} | Passed: {passed} | Failed: {failed}")
        if failed > 0:
            sys.exit(1)
        print("\nALL PAGES AND FEATURES VERIFIED WORKING SUCCESSFULLY IN SELENIUM!")

    except Exception as e:
        traceback.print_exc()
        sys.exit(1)
    finally:
        driver.quit()

if __name__ == "__main__":
    main()

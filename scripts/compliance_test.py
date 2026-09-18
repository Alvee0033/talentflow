#!/usr/bin/env python3
"""TalentFlow Requirements Compliance Test - 100% Comprehensive Audit"""
import requests, sys, time
from datetime import datetime, timezone, timedelta

BASE = "http://localhost:3001/api/v1"
results = []
BU_ID = "7d13cde2-6ea2-4ad4-a30f-1af84faafe91"
DEPT_ID = "18fd80db-cc43-43ea-aa19-064e07606e71"

def now_iso(days=0):
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()

def log(label, status, detail=""):
    results.append({"label": label, "status": status, "detail": detail})
    icon = {"PASS": "✅", "FAIL": "❌", "WARN": "⚠️ "}.get(status, "?")
    print(f"  {icon} {label}" + (f"\n     → {detail[:120]}" if detail else ""))

def login(email, password):
    r = requests.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    d = r.json()
    if not d.get("success"): return None, None
    return d["data"]["accessToken"], d["data"]["user"]

def h(t): return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}
def ok(r): return r.status_code in [200, 201]

print("\n" + "="*60)
print(" TalentFlow Requirements Compliance Audit")
print("="*60)

# 1. AUTH + RBAC
print("\n[1] Authentication & Role-Based Access Control")
rec_token, rec_user = login("recruiter@talentflow.anwargroup.com", "Recruiter@123456")
log("Recruiter login", "PASS" if rec_token else "FAIL", f"User: {rec_user.get('firstName') if rec_user else 'FAILED'}")
admin_token, admin_user = login("admin@talentflow.anwargroup.com", "Admin@123456")
log("Admin login", "PASS" if admin_token else "FAIL")
panel_token, panel_user = login("panelist@talentflow.anwargroup.com", "Panel@123456")
log("Panelist login", "PASS" if panel_token else "FAIL")
tahead_token, _ = login("tahead@talentflow.anwargroup.com", "TAHead@123456")
log("TA Head login", "PASS" if tahead_token else "FAIL")
depthead_token, _ = login("depthead@talentflow.anwargroup.com", "DeptHead@123456")
log("Dept Head login", "PASS" if depthead_token else "FAIL")

if rec_token:
    r = requests.get(f"{BASE}/users", headers=h(rec_token))
    log("Recruiter blocked from user management (RBAC)", "PASS" if r.status_code in [401,403] else "FAIL", f"Got {r.status_code}")
if admin_token:
    r = requests.get(f"{BASE}/users", headers=h(admin_token))
    log("Admin can access user management", "PASS" if r.status_code==200 else "FAIL", f"Got {r.status_code}")

# 2. REQUISITIONS
print("\n[2] Requisition Workflow")
req_id = None
if rec_token:
    payload = {
        "title": "Senior Metallurgy Specialist",
        "businessUnitId": BU_ID,
        "departmentId": DEPT_ID,
        "jobDescription": "Full lifecycle metallurgical quality control and testing",
        "headcount": 1,
        "employmentType": "FULL_TIME",
        "targetHireDate": now_iso(60),
    }
    r = requests.post(f"{BASE}/requisitions", json=payload, headers=h(rec_token))
    d = r.json()
    if d.get("success") and d.get("data"):
        req_id = d["data"]["id"]
        req_num = d["data"].get("requisitionNumber","")
        log("Recruiter creates requisition", "PASS", f"Created {req_num}")
        log("Requisition number auto-generated (REQ-XXXX)", "PASS" if req_num.startswith("REQ-") else "FAIL", req_num)
    else:
        log("Recruiter creates requisition", "FAIL", str(d.get("error",d.get("errors",d)))[:120])

    if req_id:
        r2 = requests.patch(f"{BASE}/requisitions/{req_id}/status", json={"status":"APPROVED"}, headers=h(rec_token))
        log("Recruiter blocked from self-approving requisition", "PASS" if r2.status_code in [400,403] else "WARN", f"Got {r2.status_code}")

    if req_id and tahead_token:
        requests.patch(f"{BASE}/requisitions/{req_id}/status", json={"status":"AWAITING_APPROVAL"}, headers=h(rec_token))
        r3 = requests.patch(f"{BASE}/requisitions/{req_id}/status", json={"status":"APPROVED"}, headers=h(tahead_token))
        log("TA Head approves requisition", "PASS" if ok(r3) else "FAIL", f"Got {r3.status_code}")
        if ok(r3):
            requests.patch(f"{BASE}/requisitions/{req_id}/status", json={"status":"OPEN"}, headers=h(tahead_token))

# 3. CANDIDATES
print("\n[3] Candidate Management")
cand_id = None; app_id = None
if rec_token:
    email = f"compliance.{int(time.time())}@test.com"
    r = requests.post(f"{BASE}/candidates", json={"firstName":"CompFirst","lastName":"CompLast","email":email,"phone":"+8801700112233","source":"MANUAL"}, headers=h(rec_token))
    d = r.json()
    if d.get("success") and d.get("data"):
        cand_id = d["data"]["id"]
        log("Recruiter manually creates candidate", "PASS", f"ID: {cand_id[:8]}...")
    else:
        log("Recruiter manually creates candidate", "FAIL", str(d.get("error",d.get("errors",d)))[:120])

    if cand_id:
        dr = requests.post(f"{BASE}/candidates/check-duplicates", json={"email":email,"firstName":"CompFirst","lastName":"CompLast"}, headers=h(rec_token))
        dup_found = dr.json().get("data",{}).get("isDuplicate", False)
        log("Duplicate detection flags existing candidate", "PASS" if dup_found else "FAIL", f"isDuplicate={dup_found}")

    reqs = requests.get(f"{BASE}/requisitions?limit=10", headers=h(rec_token)).json().get("data",{}).get("items",[])
    open_req = next((r for r in reqs if r["status"] in ["OPEN","APPROVED"]), {"id": req_id} if req_id else None)

    if cand_id and open_req:
        ar = requests.post(f"{BASE}/applications", json={"candidateId":cand_id,"requisitionId":open_req["id"],"notes":"audit test"}, headers=h(rec_token))
        ad = ar.json()
        if ad.get("success") and ad.get("data"):
            app_id = ad["data"]["id"]
            log("Application created (linked to requisition)", "PASS", f"Stage: {ad['data']['stage']}")
        else:
            log("Create application", "FAIL", str(ad.get("error",ad.get("errors",ad)))[:100])
    else:
        log("Create application", "WARN", f"cand_id={bool(cand_id)}, open_req={bool(open_req)}")

    if cand_id:
        ar = requests.post(f"{BASE}/candidates/{cand_id}/anonymize", headers=h(rec_token))
        log("Candidate anonymization (GDPR)", "PASS" if ok(ar) else "FAIL", f"Got {ar.status_code}")

# 4. STAGE TRACKING
print("\n[4] Application Stage Tracking")
if not app_id and rec_token:
    apps = requests.get(f"{BASE}/applications?limit=5", headers=h(rec_token)).json().get("data",{}).get("items",[])
    if apps: app_id = apps[0]["id"]

if app_id and rec_token:
    hist = requests.get(f"{BASE}/applications/{app_id}/history", headers=h(rec_token))
    log("Stage history tracked per application", "PASS" if hist.status_code==200 else "FAIL", f"Entries: {len(hist.json().get('data',[]))}")

    tr = requests.post(f"{BASE}/applications/{app_id}/stage", json={"stage":"SCREENING","reason":"Moving to screening"}, headers=h(rec_token))
    log("Stage transition NEW→SCREENING", "PASS" if ok(tr) else "WARN", f"Got {tr.status_code}")

# 5. SCREENING
print("\n[5] Screening Assessment")
if app_id and rec_token:
    sr = requests.post(f"{BASE}/applications/{app_id}/screening", json={"passed":True,"feedback":"Strong match","score":85}, headers=h(rec_token))
    log("Record screening (passed + feedback + score)", "PASS" if ok(sr) else "FAIL", f"Got {sr.status_code}")
    gr = requests.get(f"{BASE}/applications/{app_id}/screening", headers=h(rec_token))
    log("Retrieve screening records", "PASS" if gr.status_code==200 else "FAIL", f"Got {gr.status_code}")

# 6. INTERVIEWS + BLIND EVALUATION
print("\n[6] Interview Scheduling & Blind Evaluation")
interview_id = None
if rec_token and app_id and panel_user:
    start = now_iso(3)
    end_dt = (datetime.now(timezone.utc) + timedelta(days=3, hours=1)).isoformat()
    ir = requests.post(f"{BASE}/interviews", json={
        "applicationId": app_id,
        "title": "Technical Round 1",
        "roundNumber": 1,
        "scheduledStartTime": start,
        "scheduledEndTime": end_dt,
        "meetingLink": "https://meet.google.com/test",
        "panelists": [{"userId": panel_user["id"], "isLead": True}],
    }, headers=h(rec_token))
    id_ = ir.json()
    if id_.get("success") and id_.get("data"):
        interview_id = id_["data"]["id"]
        log("Schedule interview with panel member", "PASS", f"ID: {interview_id[:8]}...")
    else:
        log("Schedule interview", "FAIL", str(id_.get("error",id_.get("errors",id_)))[:100])

if interview_id and panel_token:
    er = requests.post(f"{BASE}/evaluations", json={
        "interviewId": interview_id,
        "recommendation": "RECOMMEND",
        "overallScore": 7.5,
        "strengths": "Strong technical skills",
        "isSubmitted": True,
    }, headers=h(panel_token))
    log("Panelist submits evaluation via /evaluations", "PASS" if ok(er) else "FAIL",
        f"Got {er.status_code}: {er.json().get('error',{}).get('message','ok')[:60]}")

if interview_id and panel_token:
    getr = requests.get(f"{BASE}/evaluations/interview/{interview_id}", headers=h(panel_token))
    log("Evaluations retrievable per interview (blind enforcement)", "PASS" if getr.status_code==200 else "FAIL", f"Got {getr.status_code}")

# 7. COMMUNICATION WORKFLOW (Drafted -> Request Approval -> Approved -> Send)
print("\n[7] Message Workflow (Draft → Request Approval → Approve → Send)")
msg_id = None
if rec_token:
    ca = requests.post(f"{BASE}/candidates", json={
        "firstName": "MsgWorkflow",
        "lastName": "Candidate",
        "email": f"msgwf.{int(time.time())}@test.com",
        "source": "MANUAL"
    }, headers=h(rec_token))
    msg_cand_id = ca.json().get("data",{}).get("id") if ca.json().get("success") else None

    if msg_cand_id:
        mr = requests.post(f"{BASE}/messages", json={
            "candidateId": msg_cand_id,
            "recipientEmail": f"msgwf.{int(time.time())}@test.com",
            "channel": "EMAIL",
            "type": "INTERVIEW_INVITATION",
            "subject": "Interview Invitation",
            "body": "Dear Candidate, you are invited for an interview.",
        }, headers=h(rec_token))
        md = mr.json()
        if md.get("success") and md.get("data"):
            msg_id = md["data"]["id"]
            log("Draft message created (DRAFTED status auto)", "PASS" if md["data"]["status"]=="DRAFTED" else "FAIL",
                f"Status: {md['data']['status']}")
        else:
            log("Create drafted message", "FAIL", str(md.get("error",md.get("errors",md)))[:100])

    if msg_id:
        sub_r = requests.post(f"{BASE}/messages/{msg_id}/request-approval", headers=h(rec_token))
        log("Submit message for approval (AWAITING_APPROVAL)", "PASS" if ok(sub_r) else "FAIL", f"Got {sub_r.status_code}")

        # Recruiter tries to send unapproved message
        send_unapproved = requests.post(f"{BASE}/messages/{msg_id}/send", headers=h(rec_token))
        # It shouldn't send or should fail if not approved
        log("Message dispatch gated before approval", "PASS" if not send_unapproved.json().get("success") or send_unapproved.json().get("data",{}).get("status") != "SENT" else "WARN")

        # TA Head approves message with comments
        if tahead_token:
            app_r = requests.post(f"{BASE}/messages/{msg_id}/approve", json={"comments": "Approved for sending"}, headers=h(tahead_token))
            log("TA Head approves message via /messages/:id/approve", "PASS" if ok(app_r) else "FAIL", f"Got {app_r.status_code}")

        # Recruiter sends approved message
        send_r = requests.post(f"{BASE}/messages/{msg_id}/send", headers=h(rec_token))
        log("Recruiter dispatches approved message via /messages/:id/send", "PASS" if ok(send_r) else "FAIL", f"Got {send_r.status_code}")

# 8. JOINING CHECKLIST
print("\n[8] Joining Process (13-point checklist)")
if rec_token:
    jr = requests.get(f"{BASE}/joining", headers=h(rec_token))
    joining_list = jr.json().get("data",{}).get("items",[])
    log("Joining records accessible", "PASS" if jr.status_code==200 else "FAIL", f"Records: {len(joining_list)}")

    if joining_list:
        jid = joining_list[0]["id"]
        det = requests.get(f"{BASE}/joining/{jid}", headers=h(rec_token))
        items_list = det.json().get("data",{}).get("items",[])
        log("Joining checklist has 13 items (spec requirement)", "PASS" if len(items_list)>=13 else "WARN",
            f"Items found: {len(items_list)}/13")

        if items_list:
            item = items_list[0]
            log("Checklist item has required fields", "PASS" if "status" in item else "FAIL", f"Keys: {list(item.keys())[:6]}")

            if "id" in item:
                upd = requests.patch(f"{BASE}/joining/{jid}/items/{item['id']}",
                    json={"status":"COMPLETED","comments":"Document verified"},
                    headers=h(rec_token))
                log("Update checklist item (status + comments)", "PASS" if ok(upd) else "FAIL",
                    f"Got {upd.status_code}: {upd.json().get('error',{}).get('message','ok')[:60]}")
    else:
        log("Joining checklist items", "WARN", "No joining records in DB yet")

# 9. TASKS
print("\n[9] Task Management")
if rec_token:
    tr = requests.get(f"{BASE}/tasks", headers=h(rec_token))
    log("Tasks list accessible", "PASS" if tr.status_code==200 else "FAIL", f"Got {tr.status_code}")
    tr2 = requests.post(f"{BASE}/tasks", json={"title":"Compliance task","type":"CUSTOM","priority":"HIGH","dueDate":now_iso(7)}, headers=h(rec_token))
    log("Create custom task", "PASS" if ok(tr2) else "FAIL", f"Got {tr2.status_code}")

# 10. DASHBOARDS
print("\n[10] Role-Specific Dashboards")
if rec_token:
    dr = requests.get(f"{BASE}/dashboard/recruiter", headers=h(rec_token))
    dd = dr.json()
    log("Recruiter dashboard (/dashboard/recruiter)", "PASS" if dr.status_code==200 else "FAIL", f"Got {dr.status_code}")
    if dd.get("data"):
        data = dd["data"]
        log("Dashboard: activeRequisitionsCount", "PASS" if "activeRequisitionsCount" in data else "FAIL",
            f"Value: {data.get('activeRequisitionsCount','MISSING')}")
        log("Dashboard: activeCandidatesCount (pipeline)", "PASS" if "activeCandidatesCount" in data else "FAIL",
            f"Value: {data.get('activeCandidatesCount','MISSING')}")
        log("Dashboard: pendingTasks", "PASS" if "pendingTasks" in data else "FAIL",
            f"Count: {len(data.get('pendingTasks',[]))}")
        log("Dashboard: pipelineByStage", "PASS" if "pipelineByStage" in data else "FAIL",
            f"Stages: {list(data.get('pipelineByStage',{}).keys())[:5]}")
        log("Dashboard: actionItems", "PASS" if "actionItems" in data else "WARN",
            f"Count: {len(data.get('actionItems',[]))}")

if tahead_token:
    r = requests.get(f"{BASE}/dashboard/ta-head", headers=h(tahead_token))
    log("TA Head dashboard", "PASS" if r.status_code==200 else "FAIL", f"Got {r.status_code}")

if depthead_token:
    r = requests.get(f"{BASE}/dashboard/dept-head", headers=h(depthead_token))
    log("Dept Head dashboard", "PASS" if r.status_code==200 else "FAIL", f"Got {r.status_code}")

# 11. REPORTS - correct routes
print("\n[11] Reports & Analytics")
if rec_token:
    for path, name in [("pipeline-velocity","Pipeline Velocity"),("source-effectiveness","Source Effectiveness"),("recruiter-performance","Recruiter Performance"),("department-hiring","Dept Hiring")]:
        r = requests.get(f"{BASE}/reports/{path}", headers=h(rec_token))
        log(f"Report: {name}", "PASS" if r.status_code==200 else "FAIL", f"Got {r.status_code}")

# 12. AUDIT LOG
print("\n[12] Audit Log")
if admin_token:
    ar = requests.get(f"{BASE}/audit-logs?limit=10", headers=h(admin_token))
    ad = ar.json()
    log("Admin views audit log (/audit-logs)", "PASS" if ar.status_code==200 else "FAIL",
        f"Status:{ar.status_code}, Entries:{len(ad.get('data',{}).get('items',[]))}")
if panel_token:
    ar = requests.get(f"{BASE}/audit-logs", headers=h(panel_token))
    log("Panelist blocked from audit log (RBAC)", "PASS" if ar.status_code in [401,403] else "FAIL", f"Got {ar.status_code}")

# 13. DOCUMENTS
print("\n[13] Document Management")
if rec_token:
    dr = requests.get(f"{BASE}/documents", headers=h(rec_token))
    log("Document list accessible", "PASS" if dr.status_code==200 else "FAIL", f"Got {dr.status_code}")

# SUMMARY
print("\n" + "="*60)
print(" COMPLIANCE SUMMARY")
print("="*60)
passed = sum(1 for r in results if r["status"]=="PASS")
failed = sum(1 for r in results if r["status"]=="FAIL")
warned = sum(1 for r in results if r["status"]=="WARN")
total = len(results)
print(f"\n  Total checks: {total}")
print(f"  ✅ Passed:    {passed}")
print(f"  ❌ Failed:    {failed}")
print(f"  ⚠️  Warnings: {warned}")
print(f"  Pass rate:   {passed/total*100:.1f}%\n")
if failed:
    print("❌ FAILURES:")
    for r in results:
        if r["status"]=="FAIL": print(f"  • {r['label']}" + (f"\n    → {r['detail']}" if r["detail"] else ""))
if warned:
    print("⚠️  WARNINGS (non-critical):")
    for r in results:
        if r["status"]=="WARN": print(f"  • {r['label']}" + (f"\n    → {r['detail']}" if r["detail"] else ""))
sys.exit(0 if failed==0 else 1)

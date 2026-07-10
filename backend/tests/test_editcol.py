"""EditCol V2 backend test suite — auth, editors, projects, messaging, reports, admin."""
import os
import time
import uuid
import asyncio
import json
from pathlib import Path
import pytest
import requests
import websockets
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")

if not ADMIN_EMAIL or not ADMIN_PASSWORD:
    pytest.skip("ADMIN_EMAIL and ADMIN_PASSWORD are required for backend integration tests", allow_module_level=True)

# Unique per-run prefix so tests don't collide
RUN = uuid.uuid4().hex[:8]
CLIENT_EMAIL = f"test_client_{RUN}@example.com"
EDITOR_EMAIL = f"test_editor_{RUN}@example.com"
PASSWORD = "TestPass123!"
DIGITS = "".join(str(int(ch, 16) % 10) for ch in RUN)

state = {}


def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ----------------------- Health ------------------------
def test_health():
    r = requests.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


# ----------------------- Registration ------------------------
def test_register_client():
    s = session()
    r = s.post(f"{API}/auth/register", json={
        "name": "Test Client", "email": CLIENT_EMAIL, "phone": f"+1555{DIGITS[:7]}",
        "password": PASSWORD, "role": "client"
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["email"] == CLIENT_EMAIL
    assert data["user"]["role"] == "client"
    assert data["user"]["email_verified"] is False
    assert "otp_dev" in data and "email_otp" in data["otp_dev"]
    assert "phone_otp" in data["otp_dev"]
    # cookies should be set
    assert s.cookies.get("access_token")
    assert s.cookies.get("refresh_token")
    state["client_session"] = s
    state["client_id"] = data["user"]["id"]
    state["client_otps"] = data["otp_dev"]


def test_register_editor_creates_private_editor():
    s = session()
    r = s.post(f"{API}/auth/register", json={
        "name": "Test Editor", "email": EDITOR_EMAIL, "phone": f"+1666{DIGITS[:7]}",
        "password": PASSWORD, "role": "editor"
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["role"] == "editor"
    state["editor_session"] = s
    state["editor_id"] = data["user"]["id"]
    state["editor_otps"] = data["otp_dev"]

    # GET editor by id — should exist but is_public=false (so not listed)
    r2 = requests.get(f"{API}/editors/{data['user']['id']}")
    assert r2.status_code == 200
    assert r2.json()["is_public"] is False


def test_register_duplicate_email_400():
    r = requests.post(f"{API}/auth/register", json={
        "name": "Dup", "email": CLIENT_EMAIL, "phone": "+19999999999",
        "password": PASSWORD, "role": "client"
    })
    assert r.status_code == 400


# ----------------------- OTP ------------------------
def test_verify_email_and_phone_otp():
    otps = state["client_otps"]
    r1 = requests.post(f"{API}/auth/verify-otp", json={
        "email": CLIENT_EMAIL, "otp": otps["email_otp"], "type": "email"})
    assert r1.status_code == 200 and r1.json()["ok"] is True
    r2 = requests.post(f"{API}/auth/verify-otp", json={
        "email": CLIENT_EMAIL, "otp": otps["phone_otp"], "type": "phone"})
    assert r2.status_code == 200

    # Verify via /auth/me
    s = state["client_session"]
    me = s.get(f"{API}/auth/me")
    assert me.status_code == 200
    assert me.json()["email_verified"] is True
    assert me.json()["phone_verified"] is True


def test_verify_editor_otps():
    otps = state["editor_otps"]
    requests.post(f"{API}/auth/verify-otp", json={
        "email": EDITOR_EMAIL, "otp": otps["email_otp"], "type": "email"}).raise_for_status()
    requests.post(f"{API}/auth/verify-otp", json={
        "email": EDITOR_EMAIL, "otp": otps["phone_otp"], "type": "phone"}).raise_for_status()


def test_invalid_otp_400():
    r = requests.post(f"{API}/auth/verify-otp", json={
        "email": CLIENT_EMAIL, "otp": "000000", "type": "email"})
    # already used → still 400 (no active OTP)
    assert r.status_code == 400


# ----------------------- Login & admin ------------------------
def test_admin_login_and_me():
    s = session()
    r = s.post(f"{API}/auth/login", json={
        "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD, "remember_me": True})
    assert r.status_code == 200, r.text
    assert r.json()["user"]["role"] == "admin"
    assert s.cookies.get("access_token")
    me = s.get(f"{API}/auth/me")
    assert me.status_code == 200 and me.json()["role"] == "admin"
    state["admin_session"] = s


def test_login_client_for_session():
    s = session()
    r = s.post(f"{API}/auth/login", json={
        "email": CLIENT_EMAIL, "password": PASSWORD, "remember_me": False})
    assert r.status_code == 200
    state["client_session"] = s


def test_login_editor_for_session():
    s = session()
    r = s.post(f"{API}/auth/login", json={
        "email": EDITOR_EMAIL, "password": PASSWORD, "remember_me": False})
    assert r.status_code == 200
    state["editor_session"] = s


# ----------------------- Forgot/Reset Password ------------------------
def test_forgot_and_reset_password():
    r = requests.post(f"{API}/auth/forgot-password", json={"email": CLIENT_EMAIL})
    assert r.status_code == 200
    token = r.json().get("reset_token_dev")
    if not token:
        pytest.skip("Password reset token is only returned when backend OTP_DEV_MODE is enabled")
    new_pw = "NewPass456!"
    r2 = requests.post(f"{API}/auth/reset-password",
                       json={"token": token, "new_password": new_pw})
    assert r2.status_code == 200
    # login with new password
    s = session()
    r3 = s.post(f"{API}/auth/login", json={
        "email": CLIENT_EMAIL, "password": new_pw, "remember_me": False})
    assert r3.status_code == 200
    state["client_session"] = s
    state["client_password"] = new_pw


# ----------------------- Editor Onboarding ------------------------
def test_editor_onboarding_sets_public_and_verified_badge():
    s = state["editor_session"]
    payload = {
        "bio": "Pro editor",
        "skills": ["video editing", "color"],
        "hourly_rate": 50, "starting_price": 100,
        "portfolio": [{"title": "demo", "thumbnail_b64": "data:image/png;base64,iVBOR", "url": "", "description": "demo"}],
        "avatar_b64": "data:image/png;base64,iVBOR",
        "location": "LA", "languages": ["en"], "software": ["premiere"]
    }
    r = s.put(f"{API}/editors/me", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["is_public"] is True
    assert "verified" in data["badges"]


def test_editors_list_only_public():
    r = requests.get(f"{API}/editors")
    assert r.status_code == 200
    eds = r.json()
    # Our editor should now appear
    ids = [e["id"] for e in eds]
    assert state["editor_id"] in ids
    # All listed must be public
    assert all(e["is_public"] for e in eds)


def test_get_editor_detail_has_trust():
    r = requests.get(f"{API}/editors/{state['editor_id']}")
    assert r.status_code == 200
    d = r.json()
    assert "trust_score" in d
    assert "badges" in d
    assert "reviews" in d


# ----------------------- Project + Conversation ------------------------
def test_create_project_creates_conversation():
    s = state["client_session"]
    r = s.post(f"{API}/projects", json={
        "editor_id": state["editor_id"], "title": "Project A",
        "description": "Edit my vlog", "content_type": "vlog",
        "editing_style": "fast", "motion_graphics": False,
        "footage_size": "10GB", "budget": 250.0, "deadline": "7d"
    })
    assert r.status_code == 200, r.text
    proj = r.json()
    state["project_id"] = proj["id"]
    assert proj["status"] == "pending"

    # Conversation should now exist for client
    convs = s.get(f"{API}/conversations").json()
    assert any(state["editor_id"] in c["participants"] for c in convs)
    # find conv and store id
    state["conv_id"] = next(c["id"] for c in convs if state["editor_id"] in c["participants"])
    # System message exists
    msgs = s.get(f"{API}/conversations/{state['conv_id']}/messages").json()
    assert any("Project A" in (m.get("text") or "") for m in msgs)


def test_list_projects_for_client():
    s = state["client_session"]
    r = s.get(f"{API}/projects")
    assert r.status_code == 200
    assert any(p["id"] == state["project_id"] for p in r.json())


def test_start_conversation_idempotent():
    s = state["client_session"]
    r = s.post(f"{API}/conversations/start", json={"user_id": state["editor_id"]})
    assert r.status_code == 200
    assert r.json()["id"] == state["conv_id"]


def test_send_message_and_list():
    s = state["client_session"]
    r = s.post(f"{API}/messages", json={
        "conversation_id": state["conv_id"], "text": "Hello editor"})
    assert r.status_code == 200
    msg = r.json()
    assert msg["text"] == "Hello editor"
    # editor sees it
    se = state["editor_session"]
    msgs = se.get(f"{API}/conversations/{state['conv_id']}/messages").json()
    assert any(m["text"] == "Hello editor" for m in msgs)


# ----------------------- WebSocket ------------------------
def test_websocket_receives_message():
    se = state["editor_session"]
    tok_r = se.post(f"{API}/auth/ws-token")
    assert tok_r.status_code == 200
    token = tok_r.json()["token"]

    ws_url = BASE_URL.replace("https://", "wss://").replace("http://", "ws://") + f"/api/ws?token={token}"

    async def run():
        async with websockets.connect(ws_url) as ws:
            # client sends a message via REST
            await asyncio.sleep(0.5)
            sc = state["client_session"]
            sc.post(f"{API}/messages", json={
                "conversation_id": state["conv_id"], "text": "WS test message"})
            # wait for message event
            data = await asyncio.wait_for(ws.recv(), timeout=10)
            payload = json.loads(data)
            assert payload["event"] == "message"
            assert payload["data"]["text"] == "WS test message"

    try:
        asyncio.run(run())
    except Exception as e:
        pytest.fail(f"WebSocket test failed: {e}")


# ----------------------- Reviews + Trust ------------------------
def test_create_review_updates_trust():
    s = state["client_session"]
    r = s.post(f"{API}/reviews", json={
        "editor_id": state["editor_id"], "project_id": state["project_id"],
        "rating": 5, "comment": "Amazing"})
    assert r.status_code == 200
    # editor stats updated
    d = requests.get(f"{API}/editors/{state['editor_id']}").json()
    assert d["stats"]["total_reviews"] >= 1
    assert d["stats"]["avg_rating"] >= 4


# ----------------------- Reports + admin action ------------------------
def test_create_report_then_admin_ban():
    sc = state["client_session"]
    r = sc.post(f"{API}/reports", json={
        "target_user_id": state["editor_id"], "kind": "scam",
        "reason": "test report"})
    assert r.status_code == 200
    state["report_id"] = r.json()["id"]

    sa = state["admin_session"]
    rl = sa.get(f"{API}/admin/reports")
    assert rl.status_code == 200
    assert any(rep["id"] == state["report_id"] for rep in rl.json())

    # take action: ban
    ra = sa.post(f"{API}/admin/reports/{state['report_id']}/action",
                 json={"action": "ban", "reason": "test"})
    assert ra.status_code == 200

    # target user should be banned (via admin/users)
    users = sa.get(f"{API}/admin/users").json()
    target = next((u for u in users if u["id"] == state["editor_id"]), None)
    assert target and target["status"] == "banned"
    state["editor_banned"] = True


def test_admin_endpoints_require_admin():
    s = state["client_session"]
    for ep in ["/admin/stats", "/admin/users", "/admin/editors-pending",
               "/admin/projects", "/admin/reviews", "/admin/reports"]:
        r = s.get(f"{API}{ep}")
        assert r.status_code == 403, f"{ep} should be 403 for non-admin"


def test_admin_endpoints_for_admin():
    s = state["admin_session"]
    for ep in ["/admin/stats", "/admin/users", "/admin/editors-pending",
               "/admin/projects", "/admin/reviews"]:
        r = s.get(f"{API}{ep}")
        assert r.status_code == 200, f"{ep} failed: {r.text}"


# ----------------------- Brute-force lockout ------------------------
def test_brute_force_lock_after_5_attempts():
    # Use a fresh email to isolate; uses IP+email as identifier
    target_email = f"TEST_brute_{RUN}@example.com"
    # Register user
    requests.post(f"{API}/auth/register", json={
        "name": "BF", "email": target_email, "phone": f"+1777{DIGITS[:7]}",
        "password": PASSWORD, "role": "client"})
    for i in range(5):
        r = requests.post(f"{API}/auth/login", json={
            "email": target_email, "password": "WrongPass!", "remember_me": False})
        assert r.status_code == 401
    # 6th attempt should be locked
    r = requests.post(f"{API}/auth/login", json={
        "email": target_email, "password": PASSWORD, "remember_me": False})
    assert r.status_code == 429, f"Expected 429 lockout, got {r.status_code}"


# ----------------------- DB starts empty (only admin) ------------------------
def test_db_only_admin_seeded_initially():
    # Can't truly verify "empty at start" mid-suite, but we can check admin exists
    # and no extra admin users
    s = state["admin_session"]
    users = s.get(f"{API}/admin/users").json()
    admins = [u for u in users if u["role"] == "admin"]
    assert len(admins) == 1
    assert admins[0]["email"] == ADMIN_EMAIL


# ----------------------- Banned user cannot access ------------------------
def test_banned_user_cannot_access():
    # editor was banned earlier; their old session should now fail or login should be blocked
    s = session()
    r = s.post(f"{API}/auth/login", json={
        "email": EDITOR_EMAIL, "password": PASSWORD, "remember_me": False})
    assert r.status_code == 403

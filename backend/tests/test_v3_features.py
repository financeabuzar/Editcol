"""EditCol V3 backend tests — upgrade-to-editor, public projects, applications, AI match."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "financeabuzar@gmail.com"
ADMIN_PASSWORD = "EditColAdmin@2026!Secure"

RUN = uuid.uuid4().hex[:8]
CLIENT_EMAIL = f"v3_client_{RUN}@example.com"
EDITOR1_EMAIL = f"v3_editor1_{RUN}@example.com"
EDITOR2_EMAIL = f"v3_editor2_{RUN}@example.com"
UPGRADE_EMAIL = f"v3_upgrade_{RUN}@example.com"
PASSWORD = "TestPass123!"

state = {}


def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _register_and_login(email, role):
    s = session()
    phone_digits = "".join(str(int(ch, 16) % 10) for ch in uuid.uuid4().hex[:7])
    r = s.post(f"{API}/auth/register", json={
        "name": f"V3 {role} {RUN}", "email": email, "phone": f"+1888{phone_digits}",
        "password": PASSWORD, "role": role
    })
    assert r.status_code == 200, r.text
    data = r.json()
    # auto-verify otps for cleanliness
    otps = data.get("otp_dev", {})
    if otps.get("email_otp"):
        requests.post(f"{API}/auth/verify-otp", json={"email": email, "otp": otps["email_otp"], "type": "email"})
    if otps.get("phone_otp"):
        requests.post(f"{API}/auth/verify-otp", json={"email": email, "otp": otps["phone_otp"], "type": "phone"})
    return s, data["user"]["id"]


# ---------- Setup users ----------
def test_setup_client():
    s, uid = _register_and_login(CLIENT_EMAIL, "client")
    state["client_session"] = s
    state["client_id"] = uid


def test_setup_editor1():
    s, uid = _register_and_login(EDITOR1_EMAIL, "editor")
    state["editor1_session"] = s
    state["editor1_id"] = uid
    # Onboard to make public
    r = s.put(f"{API}/editors/me", json={
        "bio": "5+ years editing vlogs and ads", "skills": ["vlog", "cinematic", "fast"],
        "hourly_rate": 40, "starting_price": 150,
        "portfolio": [{"title": "demo", "thumbnail_b64": "data:image/png;base64,iVBOR", "url": "", "description": "d"}],
        "avatar_b64": "data:image/png;base64,iVBOR",
        "location": "NY", "languages": ["en"], "software": ["premiere", "after effects"],
    })
    assert r.status_code == 200, r.text
    assert r.json()["is_public"] is True


def test_setup_editor2():
    s, uid = _register_and_login(EDITOR2_EMAIL, "editor")
    state["editor2_session"] = s
    state["editor2_id"] = uid
    r = s.put(f"{API}/editors/me", json={
        "bio": "Specialist in motion graphics and reels", "skills": ["reels", "motion graphics", "cinematic"],
        "hourly_rate": 60, "starting_price": 300,
        "portfolio": [{"title": "demo2", "thumbnail_b64": "data:image/png;base64,iVBOR", "url": "", "description": "d"}],
        "avatar_b64": "data:image/png;base64,iVBOR",
        "location": "LA", "languages": ["en"], "software": ["premiere"],
    })
    assert r.status_code == 200, r.text


# ---------- upgrade-to-editor ----------
def test_upgrade_to_editor_client_to_editor():
    s, uid = _register_and_login(UPGRADE_EMAIL, "client")
    # Confirm role is client
    me = s.get(f"{API}/auth/me").json()
    assert me["role"] == "client"

    r = s.post(f"{API}/auth/upgrade-to-editor")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True

    # Confirm role updated
    me2 = s.get(f"{API}/auth/me").json()
    assert me2["role"] == "editor"

    # Confirm editor doc exists (private by default)
    ed = requests.get(f"{API}/editors/{uid}")
    assert ed.status_code == 200
    assert ed.json()["is_public"] is False

    state["upgrade_session"] = s
    state["upgrade_id"] = uid


def test_upgrade_to_editor_idempotent_already_editor():
    s = state["upgrade_session"]
    r = s.post(f"{API}/auth/upgrade-to-editor")
    assert r.status_code == 200
    body = r.json()
    assert body.get("ok") is True
    assert body.get("already_editor") is True


def test_upgrade_to_editor_admin_400():
    s = session()
    r = s.post(f"{API}/auth/login", json={
        "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD, "remember_me": False})
    assert r.status_code == 200
    r2 = s.post(f"{API}/auth/upgrade-to-editor")
    assert r2.status_code == 400


# ---------- Public project + Applications flow ----------
def test_create_public_project():
    s = state["client_session"]
    r = s.post(f"{API}/projects/public", json={
        "title": "Edit my vlog series", "description": "10-part vlog series",
        "content_type": "vlog", "editing_style": "fast",
        "motion_graphics": False, "footage_size": "20GB",
        "budget": 500.0, "deadline": "14d",
    })
    assert r.status_code == 200, r.text
    proj = r.json()
    assert proj["status"] == "open"
    assert proj["public"] is True
    assert proj["applications_count"] == 0
    state["public_proj_id"] = proj["id"]


def test_editor_sees_public_project():
    s = state["editor1_session"]
    r = s.get(f"{API}/projects/public")
    assert r.status_code == 200
    projs = r.json()
    ids = [p["id"] for p in projs]
    assert state["public_proj_id"] in ids
    # editor hasn't applied yet
    target = next(p for p in projs if p["id"] == state["public_proj_id"])
    assert target["already_applied"] is False


def test_client_cannot_list_public_projects_as_editor():
    s = state["client_session"]
    r = s.get(f"{API}/projects/public")
    assert r.status_code == 403


def test_editor1_applies():
    s = state["editor1_session"]
    r = s.post(f"{API}/applications", json={
        "project_id": state["public_proj_id"],
        "proposal": "I can do this in 10 days, great fit",
        "proposed_budget": 480.0, "proposed_deadline": "10d",
    })
    assert r.status_code == 200, r.text
    app = r.json()
    assert app["status"] == "pending"
    assert app["editor_id"] == state["editor1_id"]
    state["app1_id"] = app["id"]


def test_editor1_cannot_apply_twice():
    s = state["editor1_session"]
    r = s.post(f"{API}/applications", json={
        "project_id": state["public_proj_id"],
        "proposal": "again",
        "proposed_budget": 100.0, "proposed_deadline": "5d",
    })
    assert r.status_code == 400


def test_editor2_applies():
    s = state["editor2_session"]
    r = s.post(f"{API}/applications", json={
        "project_id": state["public_proj_id"],
        "proposal": "Motion graphics expert here",
        "proposed_budget": 490.0, "proposed_deadline": "12d",
    })
    assert r.status_code == 200, r.text
    state["app2_id"] = r.json()["id"]


def test_editor_applications_mine_lists_with_project():
    s = state["editor1_session"]
    r = s.get(f"{API}/applications/mine")
    assert r.status_code == 200
    apps = r.json()
    assert any(a["id"] == state["app1_id"] for a in apps)
    target = next(a for a in apps if a["id"] == state["app1_id"])
    assert target.get("project") is not None
    assert target["project"]["id"] == state["public_proj_id"]


def test_client_lists_project_applications():
    s = state["client_session"]
    r = s.get(f"{API}/applications/project/{state['public_proj_id']}")
    assert r.status_code == 200
    apps = r.json()
    ids = [a["id"] for a in apps]
    assert state["app1_id"] in ids
    assert state["app2_id"] in ids
    for a in apps:
        assert "editor_profile" in a


def test_non_owner_cannot_list_applications():
    s = state["editor1_session"]
    r = s.get(f"{API}/applications/project/{state['public_proj_id']}")
    assert r.status_code == 403


def test_accept_creates_workspace_and_auto_declines_others():
    s = state["client_session"]
    r = s.post(f"{API}/applications/{state['app1_id']}/accept")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert "project_id" in body and "conversation_id" in body
    state["accept_conv_id"] = body["conversation_id"]

    # Project should now be in_progress with editor1
    s2 = state["client_session"]
    proj_list = s2.get(f"{API}/projects").json()
    target = next(p for p in proj_list if p["id"] == state["public_proj_id"])
    assert target["status"] == "in_progress"
    assert target["editor_id"] == state["editor1_id"]

    # Other application auto-declined
    apps = s2.get(f"{API}/applications/project/{state['public_proj_id']}").json()
    a2 = next(a for a in apps if a["id"] == state["app2_id"])
    assert a2["status"] == "declined"
    assert a2.get("auto_declined") is True

    # Conversation has system message
    msgs = s2.get(f"{API}/conversations/{body['conversation_id']}/messages").json()
    assert any("has started" in (m.get("text") or "") for m in msgs)
    sys_msg = next((m for m in msgs if m.get("system")), None)
    assert sys_msg is not None
    assert sys_msg.get("project_id") == state["public_proj_id"]


def test_cannot_accept_already_accepted():
    s = state["client_session"]
    r = s.post(f"{API}/applications/{state['app1_id']}/accept")
    assert r.status_code == 400


def test_cannot_apply_to_closed_project():
    s = state["editor2_session"]
    r = s.post(f"{API}/applications", json={
        "project_id": state["public_proj_id"],
        "proposal": "Try again",
        "proposed_budget": 200.0, "proposed_deadline": "5d",
    })
    # Project is no longer open
    assert r.status_code in (400, 404)


# ---------- AI Match ----------
def test_ai_match_requires_auth():
    r = requests.post(f"{API}/ai/match", json={
        "content_type": "vlog", "budget": 500.0, "deadline": "14d",
        "editing_style": "fast", "motion_graphics": False, "footage_size": "20GB",
    })
    assert r.status_code == 401


def test_ai_match_returns_matches():
    s = state["client_session"]
    r = s.post(f"{API}/ai/match", json={
        "content_type": "vlog", "budget": 500.0, "deadline": "14d",
        "editing_style": "fast", "motion_graphics": False, "footage_size": "20GB",
    }, timeout=45)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "matches" in body
    matches = body["matches"]
    # We have 2 public editors set up; should return up to 6
    assert isinstance(matches, list)
    assert len(matches) >= 1
    assert len(matches) <= 6
    for m in matches:
        assert "id" in m
        assert "name" in m
        assert "score" in m
        assert "reason" in m
        assert "badges" in m
        assert isinstance(m["score"], (int, float))


# ---------- Existing core endpoints still working ----------
def test_editors_list_still_works():
    r = requests.get(f"{API}/editors")
    assert r.status_code == 200
    ids = [e["id"] for e in r.json()]
    assert state["editor1_id"] in ids


def test_editor_detail_still_works():
    r = requests.get(f"{API}/editors/{state['editor1_id']}")
    assert r.status_code == 200
    d = r.json()
    assert "trust_score" in d and "badges" in d


def test_direct_hire_project_still_works():
    s = state["client_session"]
    r = s.post(f"{API}/projects", json={
        "editor_id": state["editor2_id"], "title": "Direct hire",
        "description": "test", "content_type": "reels",
        "editing_style": "cinematic", "motion_graphics": True,
        "footage_size": "5GB", "budget": 300.0, "deadline": "7d",
    })
    assert r.status_code == 200
    assert r.json()["status"] == "pending"


def test_ws_token_endpoint():
    s = state["client_session"]
    r = s.post(f"{API}/auth/ws-token")
    assert r.status_code == 200
    assert "token" in r.json()

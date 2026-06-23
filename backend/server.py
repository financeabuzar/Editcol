"""EditCol V2 backend — auth, editors, messaging (WebSocket), projects, trust, reports, admin."""
from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import json
import secrets
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Literal, Dict, Set

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, WebSocket, WebSocketDisconnect, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# ------------------------------- Config --------------------------------
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"
ACCESS_TTL_MIN = 60 * 24            # 1 day default
REMEMBER_TTL_MIN = 60 * 24 * 30     # 30 days
REFRESH_TTL_DAYS = 30
OTP_TTL_MIN = 10

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="EditCol V2 API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s %(message)s')
log = logging.getLogger("editcol")

# ------------------------------- Utils ---------------------------------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_token(user_id: str, role: str, ttl_min: int, ttype: str = "access") -> str:
    payload = {
        "sub": user_id, "role": role,
        "exp": now_utc() + timedelta(minutes=ttl_min), "type": ttype,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])

def set_auth_cookies(resp: Response, access: str, refresh: str, remember: bool):
    max_age = REMEMBER_TTL_MIN * 60 if remember else ACCESS_TTL_MIN * 60
    resp.set_cookie("access_token", access, httponly=True, secure=False, samesite="lax", max_age=max_age, path="/")
    resp.set_cookie("refresh_token", refresh, httponly=True, secure=False, samesite="lax", max_age=REFRESH_TTL_DAYS*86400, path="/")

def clear_auth_cookies(resp: Response):
    resp.delete_cookie("access_token", path="/")
    resp.delete_cookie("refresh_token", path="/")

def gen_otp() -> str:
    return f"{secrets.randbelow(900000) + 100000}"

def public_user(u: dict) -> dict:
    return {
        "id": u["id"], "email": u["email"], "name": u["name"], "phone": u.get("phone"),
        "role": u["role"], "email_verified": u.get("email_verified", False),
        "phone_verified": u.get("phone_verified", False),
        "avatar": u.get("avatar"), "created_at": u.get("created_at"),
        "status": u.get("status", "active"),
    }

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(401, "Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(401, "User not found")
        if user.get("status") == "banned":
            raise HTTPException(403, "Account banned")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

async def require_admin(user=Depends(get_current_user)) -> dict:
    if user["role"] != "admin":
        raise HTTPException(403, "Admin only")
    return user

# ------------------------------- Schemas --------------------------------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str = Field(min_length=6)
    role: Literal["client", "editor"]

class LoginIn(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False

class VerifyOtpIn(BaseModel):
    email: EmailStr
    otp: str
    type: Literal["email", "phone"]

class ResendOtpIn(BaseModel):
    email: EmailStr
    type: Literal["email", "phone"]

class ForgotIn(BaseModel):
    email: EmailStr

class ResetIn(BaseModel):
    token: str
    new_password: str = Field(min_length=6)

class EditorProfileIn(BaseModel):
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    hourly_rate: Optional[float] = None
    starting_price: Optional[float] = None
    portfolio: Optional[List[dict]] = None       # [{title,thumbnail_b64,url,description}]
    avatar_b64: Optional[str] = None
    location: Optional[str] = None
    languages: Optional[List[str]] = None
    software: Optional[List[str]] = None

class ProjectRequestIn(BaseModel):
    editor_id: str
    title: str
    description: str
    content_type: str
    editing_style: str
    motion_graphics: bool
    footage_size: str
    budget: float
    deadline: str        # one of "24h","3d","7d","14d","30d" or ISO date

class MessageIn(BaseModel):
    conversation_id: str
    text: Optional[str] = None
    attachment_b64: Optional[str] = None
    attachment_type: Optional[Literal["image", "video", "file"]] = None
    attachment_name: Optional[str] = None

class ReportIn(BaseModel):
    target_user_id: str
    kind: Literal["profile", "scam", "spam", "fake_review", "other"]
    reason: str

class ReviewIn(BaseModel):
    editor_id: str
    project_id: Optional[str] = None
    rating: int = Field(ge=1, le=5)
    comment: str

class StatusUpdateIn(BaseModel):
    status: Literal["pending", "in_progress", "completed", "cancelled"]

class AdminActionIn(BaseModel):
    action: Literal["approve", "reject", "suspend", "ban", "unban"]
    reason: Optional[str] = None

# ------------------------------- Auth endpoints --------------------------------
@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    if await db.users.find_one({"phone": body.phone}):
        raise HTTPException(400, "Phone already registered")
    uid = str(uuid.uuid4())
    user = {
        "id": uid, "name": body.name.strip(), "email": email, "phone": body.phone,
        "password_hash": hash_password(body.password), "role": body.role,
        "email_verified": False, "phone_verified": False, "status": "active",
        "created_at": now_utc().isoformat(), "avatar": None,
    }
    await db.users.insert_one(user)

    if body.role == "editor":
        await db.editors.insert_one({
            "id": uid, "user_id": uid, "bio": "", "skills": [], "portfolio": [],
            "hourly_rate": None, "starting_price": None, "location": None,
            "languages": [], "software": [], "avatar": None,
            "is_public": False, "badges": [],
            "trust_score": {"completion_rate": 0, "response_rate": 0,
                            "on_time_delivery_rate": 0, "satisfaction": 0},
            "stats": {"projects_completed": 0, "total_reviews": 0, "avg_rating": 0},
            "created_at": now_utc().isoformat(),
        })

    # Generate OTPs (mocked — returned for testing)
    email_otp = gen_otp(); phone_otp = gen_otp()
    expires = (now_utc() + timedelta(minutes=OTP_TTL_MIN)).isoformat()
    await db.otp_codes.insert_many([
        {"user_id": uid, "email": email, "type": "email", "code": email_otp, "expires_at": expires, "used": False},
        {"user_id": uid, "email": email, "type": "phone", "code": phone_otp, "expires_at": expires, "used": False},
    ])
    log.info(f"[OTP] {email} email_otp={email_otp} phone_otp={phone_otp}")

    access = create_token(uid, body.role, ACCESS_TTL_MIN)
    refresh = create_token(uid, body.role, REFRESH_TTL_DAYS*1440, "refresh")
    set_auth_cookies(response, access, refresh, False)
    return {"user": public_user(user), "otp_dev": {"email_otp": email_otp, "phone_otp": phone_otp}}

@api.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("locked_until") and datetime.fromisoformat(attempts["locked_until"]) > now_utc():
        raise HTTPException(429, "Too many attempts. Try again later.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        new_count = (attempts or {}).get("count", 0) + 1
        update = {"identifier": identifier, "count": new_count, "last_attempt": now_utc().isoformat()}
        if new_count >= 5:
            update["locked_until"] = (now_utc() + timedelta(minutes=15)).isoformat()
            update["count"] = 0
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)
        raise HTTPException(401, "Invalid credentials")
    if user.get("status") == "banned":
        raise HTTPException(403, "Account banned")

    await db.login_attempts.delete_one({"identifier": identifier})
    ttl = REMEMBER_TTL_MIN if body.remember_me else ACCESS_TTL_MIN
    access = create_token(user["id"], user["role"], ttl)
    refresh = create_token(user["id"], user["role"], REFRESH_TTL_DAYS*1440, "refresh")
    set_auth_cookies(response, access, refresh, body.remember_me)
    return {"user": public_user(user)}

@api.post("/auth/ws-token")
async def ws_token(user=Depends(get_current_user)):
    """Issue a short-lived token for WebSocket auth (frontend can't read httpOnly cookies)."""
    token = create_token(user["id"], user["role"], 60)  # 60-min token
    return {"token": token}

@api.post("/auth/logout")
async def logout(response: Response, user=Depends(get_current_user)):
    clear_auth_cookies(response)
    return {"ok": True}

@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return public_user(user)

@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    rt = request.cookies.get("refresh_token")
    if not rt:
        raise HTTPException(401, "No refresh token")
    try:
        payload = decode_token(rt)
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(401, "User not found")
        access = create_token(user["id"], user["role"], ACCESS_TTL_MIN)
        response.set_cookie("access_token", access, httponly=True, secure=False,
                            samesite="lax", max_age=ACCESS_TTL_MIN*60, path="/")
        return {"ok": True}
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid refresh token")

@api.post("/auth/verify-otp")
async def verify_otp(body: VerifyOtpIn):
    email = body.email.lower().strip()
    rec = await db.otp_codes.find_one({"email": email, "type": body.type, "used": False})
    if not rec:
        raise HTTPException(400, "No active OTP")
    if datetime.fromisoformat(rec["expires_at"]) < now_utc():
        raise HTTPException(400, "OTP expired")
    if rec["code"] != body.otp:
        raise HTTPException(400, "Invalid OTP")
    await db.otp_codes.update_one({"_id": rec["_id"]}, {"$set": {"used": True}})
    field = "email_verified" if body.type == "email" else "phone_verified"
    await db.users.update_one({"email": email}, {"$set": {field: True}})
    return {"ok": True, "verified": body.type}

@api.post("/auth/resend-otp")
async def resend_otp(body: ResendOtpIn):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(404, "User not found")
    code = gen_otp()
    expires = (now_utc() + timedelta(minutes=OTP_TTL_MIN)).isoformat()
    await db.otp_codes.update_many({"email": email, "type": body.type, "used": False},
                                   {"$set": {"used": True}})
    await db.otp_codes.insert_one({"user_id": user["id"], "email": email, "type": body.type,
                                   "code": code, "expires_at": expires, "used": False})
    log.info(f"[OTP-RESEND] {email} {body.type}={code}")
    return {"ok": True, "otp_dev": code}

@api.post("/auth/forgot-password")
async def forgot(body: ForgotIn):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    # Always return ok to avoid enumeration; but return token in dev mode
    if not user:
        return {"ok": True}
    token = secrets.token_urlsafe(32)
    expires = (now_utc() + timedelta(hours=1)).isoformat()
    await db.password_reset_tokens.insert_one({"token": token, "user_id": user["id"],
                                               "expires_at": expires, "used": False})
    log.info(f"[RESET] {email} reset_token={token}")
    return {"ok": True, "reset_token_dev": token}

@api.post("/auth/reset-password")
async def reset(body: ResetIn):
    rec = await db.password_reset_tokens.find_one({"token": body.token, "used": False})
    if not rec or datetime.fromisoformat(rec["expires_at"]) < now_utc():
        raise HTTPException(400, "Invalid or expired token")
    await db.users.update_one({"id": rec["user_id"]},
                              {"$set": {"password_hash": hash_password(body.new_password)}})
    await db.password_reset_tokens.update_one({"_id": rec["_id"]}, {"$set": {"used": True}})
    return {"ok": True}

# ------------------------------- Editors --------------------------------
@api.get("/editors")
async def list_editors(skill: Optional[str] = None, badge: Optional[str] = None,
                       min_price: Optional[float] = None, max_price: Optional[float] = None,
                       q: Optional[str] = None):
    query = {"is_public": True}
    if skill: query["skills"] = skill
    if badge: query["badges"] = badge
    if min_price is not None or max_price is not None:
        rng = {}
        if min_price is not None: rng["$gte"] = min_price
        if max_price is not None: rng["$lte"] = max_price
        query["starting_price"] = rng
    cursor = db.editors.find(query, {"_id": 0})
    editors = await cursor.to_list(500)
    # join name/avatar from users
    user_ids = [e["user_id"] for e in editors]
    users = {u["id"]: u async for u in db.users.find({"id": {"$in": user_ids}}, {"_id": 0})}
    out = []
    for e in editors:
        u = users.get(e["user_id"])
        if not u: continue
        if q and q.lower() not in (u["name"].lower() + " " + (e.get("bio") or "").lower()):
            continue
        out.append({**e, "name": u["name"], "email_verified": u.get("email_verified"),
                    "phone_verified": u.get("phone_verified"), "status": u.get("status")})
    return out

@api.get("/editors/{editor_id}")
async def get_editor(editor_id: str):
    e = await db.editors.find_one({"id": editor_id}, {"_id": 0})
    if not e:
        raise HTTPException(404, "Editor not found")
    u = await db.users.find_one({"id": e["user_id"]}, {"_id": 0})
    reviews = await db.reviews.find({"editor_id": editor_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {**e, "name": u["name"], "email_verified": u.get("email_verified"),
            "phone_verified": u.get("phone_verified"), "reviews": reviews,
            "status": u.get("status")}

@api.put("/editors/me")
async def update_my_editor(body: EditorProfileIn, user=Depends(get_current_user)):
    if user["role"] != "editor":
        raise HTTPException(403, "Editor role required")
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if "avatar_b64" in update:
        update["avatar"] = update.pop("avatar_b64")
        await db.users.update_one({"id": user["id"]}, {"$set": {"avatar": update["avatar"]}})
    update["updated_at"] = now_utc().isoformat()
    await db.editors.update_one({"user_id": user["id"]}, {"$set": update})
    # Recompute public/visible flag
    e = await db.editors.find_one({"user_id": user["id"]})
    u = await db.users.find_one({"id": user["id"]})
    eligible = bool(u.get("email_verified") and u.get("phone_verified")
                    and e.get("bio") and e.get("skills") and e.get("avatar")
                    and e.get("portfolio"))
    badges = list(set(e.get("badges", [])))
    if eligible and "verified" not in badges:
        badges.append("verified")
    await db.editors.update_one({"user_id": user["id"]},
                                {"$set": {"is_public": eligible, "badges": badges}})
    e = await db.editors.find_one({"user_id": user["id"]}, {"_id": 0})
    return e

@api.get("/editors/me/profile")
async def my_editor_profile(user=Depends(get_current_user)):
    e = await db.editors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not e:
        raise HTTPException(404, "Not an editor")
    u = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return {**e, "name": u["name"], "email_verified": u.get("email_verified"),
            "phone_verified": u.get("phone_verified")}

# ------------------------------- Conversations + Messages -----------------
async def get_or_create_conversation(user_a: str, user_b: str) -> dict:
    participants = sorted([user_a, user_b])
    conv = await db.conversations.find_one({"participants": participants})
    if conv:
        return conv
    conv = {
        "id": str(uuid.uuid4()), "participants": participants,
        "created_at": now_utc().isoformat(), "last_message": None,
        "last_message_at": now_utc().isoformat(),
    }
    await db.conversations.insert_one(conv)
    return conv

@api.post("/conversations/start")
async def start_conversation(payload: dict, user=Depends(get_current_user)):
    other = payload.get("user_id")
    if not other or other == user["id"]:
        raise HTTPException(400, "Invalid user_id")
    other_user = await db.users.find_one({"id": other})
    if not other_user:
        raise HTTPException(404, "User not found")
    conv = await get_or_create_conversation(user["id"], other)
    return {"id": conv["id"]}

@api.get("/conversations")
async def list_conversations(user=Depends(get_current_user)):
    convs = await db.conversations.find({"participants": user["id"]}, {"_id": 0}).sort("last_message_at", -1).to_list(200)
    # enrich with other party
    other_ids = []
    for c in convs:
        for p in c["participants"]:
            if p != user["id"]:
                other_ids.append(p)
    users = {u["id"]: u async for u in db.users.find({"id": {"$in": other_ids}}, {"_id": 0})}
    out = []
    for c in convs:
        other = next((p for p in c["participants"] if p != user["id"]), None)
        ou = users.get(other) or {}
        unread = await db.messages.count_documents({"conversation_id": c["id"],
                                                    "sender_id": {"$ne": user["id"]},
                                                    "read": False})
        out.append({**c, "other_user": {"id": ou.get("id"), "name": ou.get("name"),
                                        "avatar": ou.get("avatar"), "role": ou.get("role")},
                    "unread": unread})
    return out

@api.get("/conversations/{conv_id}/messages")
async def list_messages(conv_id: str, user=Depends(get_current_user)):
    conv = await db.conversations.find_one({"id": conv_id})
    if not conv or user["id"] not in conv["participants"]:
        raise HTTPException(404, "Conversation not found")
    msgs = await db.messages.find({"conversation_id": conv_id}, {"_id": 0}).sort("created_at", 1).to_list(2000)
    # mark as read
    await db.messages.update_many({"conversation_id": conv_id, "sender_id": {"$ne": user["id"]},
                                   "read": False}, {"$set": {"read": True, "read_at": now_utc().isoformat()}})
    return msgs

@api.post("/messages")
async def send_message(body: MessageIn, user=Depends(get_current_user)):
    conv = await db.conversations.find_one({"id": body.conversation_id})
    if not conv or user["id"] not in conv["participants"]:
        raise HTTPException(404, "Conversation not found")
    msg = {
        "id": str(uuid.uuid4()), "conversation_id": conv["id"],
        "sender_id": user["id"], "text": body.text or "",
        "attachment_b64": body.attachment_b64,
        "attachment_type": body.attachment_type,
        "attachment_name": body.attachment_name,
        "created_at": now_utc().isoformat(), "read": False,
    }
    await db.messages.insert_one(msg.copy())
    await db.conversations.update_one({"id": conv["id"]},
        {"$set": {"last_message": (msg["text"] or "[attachment]")[:140],
                  "last_message_at": msg["created_at"]}})
    msg.pop("_id", None)
    await manager.broadcast_conversation(conv["id"], {"event": "message", "data": msg})
    return msg

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.user_sockets: Dict[str, Set[WebSocket]] = {}
    async def connect(self, user_id: str, ws: WebSocket):
        await ws.accept()
        self.user_sockets.setdefault(user_id, set()).add(ws)
    def disconnect(self, user_id: str, ws: WebSocket):
        if user_id in self.user_sockets:
            self.user_sockets[user_id].discard(ws)
            if not self.user_sockets[user_id]:
                del self.user_sockets[user_id]
    async def send_to_user(self, user_id: str, payload: dict):
        sockets = list(self.user_sockets.get(user_id, []))
        dead = []
        for ws in sockets:
            try: await ws.send_json(payload)
            except Exception: dead.append(ws)
        for ws in dead: self.disconnect(user_id, ws)
    async def broadcast_conversation(self, conv_id: str, payload: dict):
        conv = await db.conversations.find_one({"id": conv_id})
        if not conv: return
        for uid in conv["participants"]:
            await self.send_to_user(uid, payload)

manager = ConnectionManager()

@app.websocket("/api/ws")
async def ws_endpoint(websocket: WebSocket, token: str = Query(None)):
    if not token:
        await websocket.close(code=4401); return
    try:
        payload = decode_token(token)
        user_id = payload["sub"]
    except Exception:
        await websocket.close(code=4401); return
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            event = data.get("event")
            if event == "typing":
                conv_id = data.get("conversation_id")
                if conv_id:
                    await manager.broadcast_conversation(conv_id,
                        {"event": "typing", "data": {"conversation_id": conv_id, "user_id": user_id}})
            elif event == "ping":
                await websocket.send_json({"event": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
    except Exception:
        manager.disconnect(user_id, websocket)

# ------------------------------- Project requests ---------------------
@api.post("/projects")
async def create_project(body: ProjectRequestIn, user=Depends(get_current_user)):
    if user["role"] != "client":
        raise HTTPException(403, "Only clients can create project requests")
    editor = await db.editors.find_one({"id": body.editor_id})
    if not editor:
        raise HTTPException(404, "Editor not found")
    proj = {
        "id": str(uuid.uuid4()), "client_id": user["id"], "editor_id": body.editor_id,
        "title": body.title, "description": body.description,
        "content_type": body.content_type, "editing_style": body.editing_style,
        "motion_graphics": body.motion_graphics, "footage_size": body.footage_size,
        "budget": body.budget, "deadline": body.deadline,
        "status": "pending", "created_at": now_utc().isoformat(),
    }
    await db.projects.insert_one(proj.copy())
    # Auto-create / fetch conversation and send a system message
    conv = await get_or_create_conversation(user["id"], body.editor_id)
    sys_msg = {
        "id": str(uuid.uuid4()), "conversation_id": conv["id"],
        "sender_id": user["id"], "text": f"📄 New project request: {body.title} — Budget ${body.budget}",
        "attachment_b64": None, "attachment_type": None, "attachment_name": None,
        "created_at": now_utc().isoformat(), "read": False, "system": True, "project_id": proj["id"],
    }
    await db.messages.insert_one(sys_msg.copy())
    await db.conversations.update_one({"id": conv["id"]},
        {"$set": {"last_message": sys_msg["text"], "last_message_at": sys_msg["created_at"]}})
    sys_msg.pop("_id", None)
    await manager.broadcast_conversation(conv["id"], {"event": "message", "data": sys_msg})
    proj.pop("_id", None)
    return proj

@api.get("/projects")
async def list_projects(user=Depends(get_current_user)):
    query = {"client_id": user["id"]} if user["role"] == "client" else {"editor_id": user["id"]}
    if user["role"] == "admin": query = {}
    projs = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return projs

@api.patch("/projects/{pid}/status")
async def update_project_status(pid: str, body: StatusUpdateIn, user=Depends(get_current_user)):
    proj = await db.projects.find_one({"id": pid})
    if not proj:
        raise HTTPException(404, "Project not found")
    if user["id"] not in (proj["client_id"], proj["editor_id"]) and user["role"] != "admin":
        raise HTTPException(403, "Forbidden")
    await db.projects.update_one({"id": pid}, {"$set": {"status": body.status,
                                                         "updated_at": now_utc().isoformat()}})
    # Update editor stats on completion
    if body.status == "completed":
        await recompute_trust(proj["editor_id"])
    return {"ok": True}

async def recompute_trust(editor_id: str):
    projs = await db.projects.find({"editor_id": editor_id}).to_list(1000)
    total = len(projs)
    completed = sum(1 for p in projs if p["status"] == "completed")
    on_time = completed  # simplified — assume all completed are on time
    reviews = await db.reviews.find({"editor_id": editor_id}).to_list(1000)
    avg = round(sum(r["rating"] for r in reviews) / len(reviews), 2) if reviews else 0
    msgs = await db.messages.count_documents({"sender_id": editor_id})
    convs = await db.conversations.count_documents({"participants": editor_id})
    response_rate = min(100, int((msgs / convs) * 20)) if convs else 0
    trust = {
        "completion_rate": int((completed / total) * 100) if total else 0,
        "response_rate": response_rate,
        "on_time_delivery_rate": int((on_time / completed) * 100) if completed else 0,
        "satisfaction": int(avg * 20),
    }
    badges = ["verified"]
    if completed >= 5: badges.append("pro")
    if avg >= 4.7 and len(reviews) >= 5: badges.append("top_rated")
    if completed >= 20 and avg >= 4.8: badges.append("elite")
    await db.editors.update_one({"id": editor_id},
        {"$set": {"trust_score": trust,
                  "stats": {"projects_completed": completed,
                            "total_reviews": len(reviews), "avg_rating": avg},
                  "badges": badges}})

# ------------------------------- Reviews --------------------------------
@api.post("/reviews")
async def post_review(body: ReviewIn, user=Depends(get_current_user)):
    if user["role"] != "client":
        raise HTTPException(403, "Only clients can review")
    review = {
        "id": str(uuid.uuid4()), "editor_id": body.editor_id, "client_id": user["id"],
        "client_name": user["name"], "project_id": body.project_id,
        "rating": body.rating, "comment": body.comment,
        "created_at": now_utc().isoformat(), "verified_purchase": bool(body.project_id),
        "flagged": False,
    }
    await db.reviews.insert_one(review.copy())
    await recompute_trust(body.editor_id)
    review.pop("_id", None)
    return review

# ------------------------------- Reports --------------------------------
@api.post("/reports")
async def create_report(body: ReportIn, user=Depends(get_current_user)):
    target = await db.users.find_one({"id": body.target_user_id})
    if not target:
        raise HTTPException(404, "Target not found")
    rep = {
        "id": str(uuid.uuid4()), "reporter_id": user["id"], "reporter_name": user["name"],
        "target_user_id": body.target_user_id, "target_name": target["name"],
        "kind": body.kind, "reason": body.reason, "status": "open",
        "created_at": now_utc().isoformat(),
    }
    await db.reports.insert_one(rep.copy())
    rep.pop("_id", None)
    return rep

@api.post("/blocks")
async def block_user(payload: dict, user=Depends(get_current_user)):
    target = payload.get("user_id")
    if not target: raise HTTPException(400, "user_id required")
    await db.blocks.update_one({"blocker_id": user["id"], "blocked_id": target},
                               {"$set": {"created_at": now_utc().isoformat()}}, upsert=True)
    return {"ok": True}

# ------------------------------- Admin ---------------------------------
@api.get("/admin/stats")
async def admin_stats(user=Depends(require_admin)):
    return {
        "users": await db.users.count_documents({}),
        "editors": await db.editors.count_documents({}),
        "public_editors": await db.editors.count_documents({"is_public": True}),
        "open_reports": await db.reports.count_documents({"status": "open"}),
        "projects": await db.projects.count_documents({}),
        "pending_projects": await db.projects.count_documents({"status": "pending"}),
    }

@api.get("/admin/users")
async def admin_users(user=Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    return users

@api.get("/admin/editors-pending")
async def admin_editors_pending(user=Depends(require_admin)):
    eds = await db.editors.find({}, {"_id": 0}).to_list(1000)
    users = {u["id"]: u async for u in db.users.find({}, {"_id": 0, "password_hash": 0})}
    out = []
    for e in eds:
        u = users.get(e["user_id"])
        if not u: continue
        out.append({**e, "name": u["name"], "email": u["email"], "phone": u.get("phone"),
                    "email_verified": u.get("email_verified"),
                    "phone_verified": u.get("phone_verified")})
    return out

@api.get("/admin/reports")
async def admin_reports(user=Depends(require_admin)):
    reps = await db.reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return reps

@api.get("/admin/projects")
async def admin_projects(user=Depends(require_admin)):
    return await db.projects.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api.get("/admin/reviews")
async def admin_reviews(user=Depends(require_admin)):
    return await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api.post("/admin/reports/{rid}/action")
async def admin_report_action(rid: str, body: AdminActionIn, user=Depends(require_admin)):
    rep = await db.reports.find_one({"id": rid})
    if not rep: raise HTTPException(404, "Report not found")
    status_map = {"approve": "resolved", "reject": "dismissed",
                  "suspend": "resolved", "ban": "resolved", "unban": "resolved"}
    await db.reports.update_one({"id": rid},
        {"$set": {"status": status_map[body.action], "admin_action": body.action,
                  "admin_reason": body.reason, "resolved_at": now_utc().isoformat()}})
    if body.action in ("suspend", "ban"):
        await db.users.update_one({"id": rep["target_user_id"]},
            {"$set": {"status": "banned" if body.action == "ban" else "suspended"}})
    elif body.action == "unban":
        await db.users.update_one({"id": rep["target_user_id"]}, {"$set": {"status": "active"}})
    return {"ok": True}

@api.post("/admin/users/{uid}/action")
async def admin_user_action(uid: str, body: AdminActionIn, user=Depends(require_admin)):
    target = await db.users.find_one({"id": uid})
    if not target: raise HTTPException(404, "User not found")
    if body.action == "ban":
        await db.users.update_one({"id": uid}, {"$set": {"status": "banned"}})
    elif body.action == "suspend":
        await db.users.update_one({"id": uid}, {"$set": {"status": "suspended"}})
    elif body.action == "unban":
        await db.users.update_one({"id": uid}, {"$set": {"status": "active"}})
    elif body.action == "approve":
        # boost badges manually
        await db.editors.update_one({"user_id": uid}, {"$addToSet": {"badges": "verified"}})
    return {"ok": True}

@api.delete("/admin/reviews/{rid}")
async def admin_delete_review(rid: str, user=Depends(require_admin)):
    r = await db.reviews.find_one({"id": rid})
    if not r: raise HTTPException(404, "Not found")
    await db.reviews.delete_one({"id": rid})
    await recompute_trust(r["editor_id"])
    return {"ok": True}

# ------------------------------- Root -----------------------------------
@api.get("/")
async def root():
    return {"app": "EditCol V2", "status": "ok"}

@api.get("/health")
async def health():
    return {"status": "healthy", "time": now_utc().isoformat()}

app.include_router(api)

origins = os.environ.get('CORS_ORIGINS', '*').split(',')
app.add_middleware(CORSMiddleware,
    allow_origins=origins, allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"])

# ------------------------------- Startup --------------------------------
@app.on_event("startup")
async def startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("phone")
    await db.users.create_index("id", unique=True)
    await db.editors.create_index("id", unique=True)
    await db.editors.create_index("user_id", unique=True)
    await db.otp_codes.create_index("email")
    await db.password_reset_tokens.create_index("token", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.conversations.create_index("participants")
    await db.messages.create_index("conversation_id")
    await db.projects.create_index("client_id")
    await db.projects.create_index("editor_id")
    await db.reports.create_index("status")
    await db.reviews.create_index("editor_id")

    # Idempotent admin seed
    email = os.environ["ADMIN_EMAIL"].lower()
    pw = os.environ["ADMIN_PASSWORD"]
    name = os.environ.get("ADMIN_NAME", "Admin")
    existing = await db.users.find_one({"email": email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": email, "name": name, "phone": "+10000000000",
            "password_hash": hash_password(pw), "role": "admin",
            "email_verified": True, "phone_verified": True, "status": "active",
            "created_at": now_utc().isoformat(),
        })
        log.info(f"Admin seeded: {email}")
    elif not verify_password(pw, existing["password_hash"]):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(pw)}})
        log.info(f"Admin password updated: {email}")

@app.on_event("shutdown")
async def shutdown():
    client.close()

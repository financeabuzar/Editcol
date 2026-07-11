"""EditCol V2 backend — auth, editors, messaging (WebSocket), projects, trust, reports, admin."""
from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
from dotenv import load_dotenv
load_dotenv()
import uuid
import json
import secrets
import logging
import asyncio
import base64
import smtplib
import hashlib
import math
from datetime import datetime, timezone, timedelta
from email.message import EmailMessage
from html import escape
from typing import Annotated, Optional, List, Literal, Dict, Set, Any

import bcrypt
import jwt
import requests
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, WebSocket, WebSocketDisconnect, Query, Path as ApiPath
from fastapi.exceptions import RequestValidationError
from starlette.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument
from pymongo.errors import PyMongoError
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator, model_validator

# ------------------------------- Config --------------------------------
def env_int(name: str, default: int, minimum: int = 1) -> int:
    try:
        value = int(os.environ.get(name, str(default)))
        return max(minimum, value)
    except (TypeError, ValueError):
        return default

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"
ACCESS_TTL_MIN = 60 * 24            # 1 day default
REMEMBER_TTL_MIN = 60 * 24 * 30     # 30 days
REFRESH_TTL_DAYS = 30
OTP_TTL_MIN = 10
OTP_DEV_MODE = os.environ.get("OTP_DEV_MODE", "false").lower() == "true"
LOGIN_OTP_REQUIRED = os.environ.get("LOGIN_OTP_REQUIRED", "true").lower() == "true"
EMAIL_PROVIDER = os.environ.get("EMAIL_PROVIDER", "smtp").lower()
EMAIL_FROM = os.environ.get("EMAIL_FROM", "EditCol <no-reply@editcol.com>")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
SMTP_USE_SSL = os.environ.get("SMTP_USE_SSL", "true" if SMTP_PORT == 465 else "false").lower() == "true"
SMTP_USE_TLS = os.environ.get("SMTP_USE_TLS", "true").lower() == "true"
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.environ.get("TWILIO_FROM_NUMBER")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "true").lower() == "true"
COOKIE_SAMESITE = os.environ.get("COOKIE_SAMESITE", "none").lower()
COOKIE_DOMAIN = os.environ.get("COOKIE_DOMAIN") or None
RATE_LIMIT_ENABLED = os.environ.get("RATE_LIMIT_ENABLED", "true").lower() == "true"
RATE_LIMIT_AUTH_IP_LIMIT = env_int("RATE_LIMIT_AUTH_IP_LIMIT", 30)
RATE_LIMIT_AUTH_ACCOUNT_LIMIT = env_int("RATE_LIMIT_AUTH_ACCOUNT_LIMIT", 10)
RATE_LIMIT_AUTH_WINDOW_SECONDS = env_int("RATE_LIMIT_AUTH_WINDOW_SECONDS", 300)
RATE_LIMIT_PUBLIC_IP_LIMIT = env_int("RATE_LIMIT_PUBLIC_IP_LIMIT", 120)
RATE_LIMIT_PUBLIC_WINDOW_SECONDS = env_int("RATE_LIMIT_PUBLIC_WINDOW_SECONDS", 60)
RATE_LIMIT_AUTHENTICATED_USER_LIMIT = env_int("RATE_LIMIT_AUTHENTICATED_USER_LIMIT", 600)
RATE_LIMIT_AUTHENTICATED_WINDOW_SECONDS = env_int("RATE_LIMIT_AUTHENTICATED_WINDOW_SECONDS", 60)
RATE_LIMIT_BACKOFF_FAILURES = env_int("RATE_LIMIT_BACKOFF_FAILURES", 5)
RATE_LIMIT_BACKOFF_INITIAL_SECONDS = env_int("RATE_LIMIT_BACKOFF_INITIAL_SECONDS", 60)
RATE_LIMIT_BACKOFF_FACTOR = env_int("RATE_LIMIT_BACKOFF_FACTOR", 2)
RATE_LIMIT_BACKOFF_MAX_SECONDS = env_int("RATE_LIMIT_BACKOFF_MAX_SECONDS", 900)
RATE_LIMIT_BACKOFF_FAILURE_WINDOW_SECONDS = env_int("RATE_LIMIT_BACKOFF_FAILURE_WINDOW_SECONDS", 3600)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="EditCol V2 API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s %(message)s')
log = logging.getLogger("editcol")

GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again."
GENERIC_DATABASE_ERROR_MESSAGE = "We could not complete that request right now. Please try again."
GENERIC_VALIDATION_ERROR_MESSAGE = "Invalid request. Check your input and try again."

SAFE_HTTP_MESSAGES = {
    400: "Invalid request. Check your input and try again.",
    401: "Please sign in to continue.",
    403: "You do not have permission to perform this action.",
    404: "We could not find what you requested.",
    405: "That action is not supported.",
    409: "That request conflicts with the current state.",
    413: "The uploaded content is too large.",
    422: GENERIC_VALIDATION_ERROR_MESSAGE,
    429: "Too many requests. Please slow down.",
}

UNSAFE_ERROR_TOKENS = (
    "traceback",
    "file \"",
    "line ",
    "winerror",
    "errno",
    "mongodb",
    "pymongo",
    "duplicate key",
    "e11000",
    "objectid",
    "d:\\",
    "c:\\",
    "/app/",
    "/users/",
    "/home/",
    "site-packages",
    "stack",
)

def request_context(request: Request) -> dict:
    return {
        "method": request.method,
        "path": request.url.path,
        "client": client_ip(request),
    }

def is_safe_error_message(message: str) -> bool:
    lowered = message.lower()
    return not any(token in lowered for token in UNSAFE_ERROR_TOKENS)

def public_error_message(status_code: int, detail=None) -> str:
    if isinstance(detail, str) and is_safe_error_message(detail):
        return detail
    return SAFE_HTTP_MESSAGES.get(status_code, GENERIC_ERROR_MESSAGE)

def error_response(status_code: int, message: str, headers: Optional[dict] = None) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"detail": message},
        headers=headers,
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    log.warning("Request validation failed", extra={**request_context(request), "errors": exc.errors()})
    return error_response(422, GENERIC_VALIDATION_ERROR_MESSAGE)

@app.exception_handler(HTTPException)
async def fastapi_http_exception_handler(request: Request, exc: HTTPException):
    message = public_error_message(exc.status_code, exc.detail)
    if message != exc.detail:
        log.warning("Sanitized HTTP error detail", extra={**request_context(request), "status_code": exc.status_code, "detail": exc.detail})
    return error_response(exc.status_code, message, getattr(exc, "headers", None))

@app.exception_handler(StarletteHTTPException)
async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
    message = public_error_message(exc.status_code, exc.detail)
    if message != exc.detail:
        log.warning("Sanitized Starlette HTTP error detail", extra={**request_context(request), "status_code": exc.status_code, "detail": exc.detail})
    return error_response(exc.status_code, message, getattr(exc, "headers", None))

@app.exception_handler(PyMongoError)
async def database_exception_handler(request: Request, exc: PyMongoError):
    log.exception("Database operation failed", extra=request_context(request))
    return error_response(500, GENERIC_DATABASE_ERROR_MESSAGE)

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    log.exception("Unhandled API error", extra=request_context(request))
    return error_response(500, GENERIC_ERROR_MESSAGE)

SENSITIVE_AUTH_PATHS = {
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/google",
    "/api/auth/verify-login-otp",
    "/api/auth/resend-login-otp",
    "/api/auth/verify-otp",
    "/api/auth/resend-otp",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/auth/refresh",
}

PUBLIC_READ_PATHS = {
    "/api/",
    "/api/health",
    "/api/editors",
}

# ------------------------------- Utils ---------------------------------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def parse_iso_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except (TypeError, ValueError):
        return None

def client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

def stable_key(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()

async def request_json_body(request: Request) -> dict:
    body = await request.body()

    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}

    request._receive = receive
    if not body:
        return {}
    try:
        parsed = json.loads(body.decode())
        return parsed if isinstance(parsed, dict) else {}
    except (UnicodeDecodeError, json.JSONDecodeError):
        return {}

def account_key_for_auth_request(path: str, body: dict, request: Request) -> Optional[str]:
    candidate = (
        body.get("email")
        or body.get("identifier")
        or body.get("phone")
        or body.get("token")
        or body.get("credential")
    )
    if not candidate and path == "/api/auth/refresh":
        candidate = request.cookies.get("refresh_token")
    if not candidate:
        return None
    normalized = normalize_login_identifier(str(candidate))
    return stable_key(normalized)

def authenticated_subject(request: Request) -> Optional[str]:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        return None
    try:
        payload = decode_token(token)
        if payload.get("type") == "access":
            return payload.get("sub")
    except jwt.InvalidTokenError:
        return None
    return None

async def increment_rate_window(scope: str, identity: str, limit: int, window_seconds: int) -> Optional[int]:
    timestamp = int(now_utc().timestamp())
    window_start = timestamp - (timestamp % window_seconds)
    key = f"{scope}:{identity}:{window_start}"
    expires_at = (now_utc() + timedelta(seconds=window_seconds * 2)).isoformat()
    result = await db.rate_limits.find_one_and_update(
        {"key": key},
        {
            "$inc": {"count": 1},
            "$setOnInsert": {"key": key, "scope": scope, "identity": identity, "window_start": window_start},
            "$set": {"expires_at": expires_at},
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    count = (result or {}).get("count", 1)
    if count > limit:
        return window_start + window_seconds - timestamp
    return None

async def enforce_rate_window(scope: str, identity: str, limit: int, window_seconds: int):
    retry_after = await increment_rate_window(scope, identity, limit, window_seconds)
    if retry_after is not None:
        raise HTTPException(
            429,
            "Too many requests. Please slow down.",
            headers={"Retry-After": str(max(1, retry_after))},
        )

def rate_limited_response(exc: HTTPException) -> JSONResponse:
    return error_response(exc.status_code, public_error_message(exc.status_code, exc.detail), getattr(exc, "headers", None))

async def enforce_auth_backoff(ip: str, account_key: Optional[str]):
    keys = [f"ip:{stable_key(ip)}"]
    if account_key:
        keys.append(f"account:{account_key}")
    docs = await db.auth_rate_backoffs.find({"key": {"$in": keys}}).to_list(len(keys))
    retry_after = 0
    current = now_utc()
    for doc in docs:
        backoff_until = parse_iso_datetime(doc.get("backoff_until"))
        if backoff_until and backoff_until > current:
            retry_after = max(retry_after, math.ceil((backoff_until - current).total_seconds()))
    if retry_after:
        raise HTTPException(
            429,
            f"Too many failed attempts. Try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )

async def record_auth_failure(ip: str, account_key: Optional[str]):
    current = now_utc()
    keys = [f"ip:{stable_key(ip)}"]
    if account_key:
        keys.append(f"account:{account_key}")
    for key in keys:
        existing = await db.auth_rate_backoffs.find_one({"key": key})
        last_failure = parse_iso_datetime((existing or {}).get("last_failure"))
        previous_failures = (existing or {}).get("failures", 0)
        if not last_failure or last_failure < current - timedelta(seconds=RATE_LIMIT_BACKOFF_FAILURE_WINDOW_SECONDS):
            previous_failures = 0
        failures = previous_failures + 1
        update: Dict[str, Any] = {
            "key": key,
            "failures": failures,
            "last_failure": current.isoformat(),
            "expires_at": (current + timedelta(seconds=RATE_LIMIT_BACKOFF_FAILURE_WINDOW_SECONDS)).isoformat(),
        }
        if failures >= RATE_LIMIT_BACKOFF_FAILURES:
            exponent = failures - RATE_LIMIT_BACKOFF_FAILURES
            delay = min(
                RATE_LIMIT_BACKOFF_MAX_SECONDS,
                RATE_LIMIT_BACKOFF_INITIAL_SECONDS * (RATE_LIMIT_BACKOFF_FACTOR ** exponent),
            )
            update["backoff_until"] = (current + timedelta(seconds=delay)).isoformat()
        await db.auth_rate_backoffs.update_one({"key": key}, {"$set": update}, upsert=True)

async def clear_auth_backoff(ip: str, account_key: Optional[str]):
    keys = [f"ip:{stable_key(ip)}"]
    if account_key:
        keys.append(f"account:{account_key}")
    await db.auth_rate_backoffs.delete_many({"key": {"$in": keys}})

def is_public_endpoint(request: Request) -> bool:
    path = request.url.path
    if path in PUBLIC_READ_PATHS:
        return True
    return request.method == "GET" and path.startswith("/api/editors/")

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if not RATE_LIMIT_ENABLED or not request.url.path.startswith("/api"):
        return await call_next(request)

    path = request.url.path
    ip = client_ip(request)
    account_key = None
    try:
        if path in SENSITIVE_AUTH_PATHS:
            body = await request_json_body(request)
            account_key = account_key_for_auth_request(path, body, request)
            await enforce_rate_window("auth-ip", stable_key(ip), RATE_LIMIT_AUTH_IP_LIMIT, RATE_LIMIT_AUTH_WINDOW_SECONDS)
            if account_key:
                await enforce_rate_window("auth-account", account_key, RATE_LIMIT_AUTH_ACCOUNT_LIMIT, RATE_LIMIT_AUTH_WINDOW_SECONDS)
            await enforce_auth_backoff(ip, account_key)
        else:
            subject = authenticated_subject(request)
            if subject:
                await enforce_rate_window(
                    "authenticated-user",
                    stable_key(subject),
                    RATE_LIMIT_AUTHENTICATED_USER_LIMIT,
                    RATE_LIMIT_AUTHENTICATED_WINDOW_SECONDS,
                )
            elif is_public_endpoint(request) or not subject:
                await enforce_rate_window("public-ip", stable_key(ip), RATE_LIMIT_PUBLIC_IP_LIMIT, RATE_LIMIT_PUBLIC_WINDOW_SECONDS)
    except HTTPException as exc:
        return rate_limited_response(exc)
    except Exception:
        log.exception("Rate-limit middleware failed", extra=request_context(request))
        return error_response(500, GENERIC_ERROR_MESSAGE)

    try:
        response = await call_next(request)
    except Exception:
        log.exception("Unhandled request error", extra=request_context(request))
        return error_response(500, GENERIC_ERROR_MESSAGE)

    if path in SENSITIVE_AUTH_PATHS and path != "/api/auth/login" and response.status_code in (400, 401):
        try:
            await record_auth_failure(ip, account_key)
        except Exception:
            log.exception("Failed to record auth failure", extra=request_context(request))
    return response

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
    resp.set_cookie("access_token", access, httponly=True, secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE, max_age=max_age, path="/", domain=COOKIE_DOMAIN)
    resp.set_cookie("refresh_token", refresh, httponly=True, secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE, max_age=REFRESH_TTL_DAYS*86400, path="/", domain=COOKIE_DOMAIN)

def clear_auth_cookies(resp: Response):
    resp.delete_cookie("access_token", path="/", domain=COOKIE_DOMAIN)
    resp.delete_cookie("refresh_token", path="/", domain=COOKIE_DOMAIN)

def gen_otp() -> str:
    return f"{secrets.randbelow(900000) + 100000}"

def normalize_phone(phone: str) -> str:
    phone = (phone or "").strip()
    if phone.startswith("+"):
        return "+" + "".join(ch for ch in phone[1:] if ch.isdigit())
    return "".join(ch for ch in phone if ch.isdigit())

def normalize_login_identifier(identifier: str) -> str:
    identifier = (identifier or "").strip()
    if "@" in identifier:
        return identifier.lower()
    return normalize_phone(identifier)

def _otp_message(code: str, purpose: str) -> str:
    return f"Your EditCol {purpose} code is {code}. It expires in {OTP_TTL_MIN} minutes."

def _otp_email_html(code: str, purpose: str) -> str:
    safe_code = escape(code)
    safe_purpose = escape(purpose)
    title = f"Your {safe_purpose} code"
    preheader = f"Your EditCol {safe_purpose} code is inside. It expires in {OTP_TTL_MIN} minutes."
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EditCol {safe_purpose.title()} Code</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:'Segoe UI', Helvetica, Arial, sans-serif;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
    {preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:32px 0;">
    <tr>
      <td align="center" style="padding:0 12px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%; max-width:480px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color:#0A0A0A; padding:28px 32px; text-align:center;">
              <span style="font-size:22px; font-weight:800; color:#ffffff; letter-spacing:0.3px;">
                Edit<span style="color:#39FF14;">Col</span>
              </span>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 32px 24px 32px;">
              <p style="margin:0 0 4px 0; font-size:14px; color:#64748b;">Hi there,</p>
              <h1 style="margin:0 0 16px 0; font-size:20px; color:#111827;">{title}</h1>
              <p style="margin:0 0 24px 0; font-size:14px; line-height:1.6; color:#4b5563;">
                Use the code below to continue with your EditCol account. This code will expire in <strong>{OTP_TTL_MIN} minutes</strong>.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0;">
                    <div style="display:inline-block; background-color:#f8ffdc; border:1px solid #DFFF00; border-radius:8px; padding:16px 32px; box-shadow:0 0 18px rgba(57,255,20,0.14);">
                      <span style="font-size:32px; font-weight:800; letter-spacing:8px; color:#0A0A0A;">
                        {safe_code}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0; font-size:13px; line-height:1.6; color:#94a3b8;">
                Didn't request this code? You can safely ignore this email; no changes will be made to your account.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none; border-top:1px solid #e5e7eb; margin:0;">
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 32px 32px; text-align:center;">
              <p style="margin:0 0 8px 0; font-size:12px; color:#94a3b8;">
                EditCol - Hire trusted video editors, fast.
              </p>
              <p style="margin:0; font-size:12px; color:#c1c5cb;">
                Copyright 2026 EditCol. All rights reserved.
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%; max-width:480px;">
          <tr>
            <td style="padding:16px 32px; text-align:center;">
              <p style="margin:0; font-size:11px; color:#94a3b8;">
                This is an automated message, please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

def _send_email_sync(to_email: str, code: str, purpose: str):
    subject = f"Your EditCol {purpose} code"
    text = _otp_message(code, purpose)
    html = _otp_email_html(code, purpose)

    if EMAIL_PROVIDER == "resend":
        if not RESEND_API_KEY:
            raise RuntimeError("RESEND_API_KEY is not configured")
        resp = requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
            json={"from": EMAIL_FROM, "to": [to_email], "subject": subject, "text": text, "html": html},
            timeout=15,
        )
        if resp.status_code >= 400:
            raise RuntimeError(f"Resend email failed: {resp.status_code} {resp.text[:200]}")
        return

    if not SMTP_HOST:
        raise RuntimeError("SMTP_HOST is not configured")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = EMAIL_FROM
    msg["To"] = to_email
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")

    smtp_cls = smtplib.SMTP_SSL if SMTP_USE_SSL else smtplib.SMTP
    with smtp_cls(SMTP_HOST, SMTP_PORT, timeout=15) as smtp:
        if SMTP_USE_TLS and not SMTP_USE_SSL:
            smtp.starttls()
        if SMTP_USER and SMTP_PASSWORD:
            smtp.login(SMTP_USER, SMTP_PASSWORD)
        smtp.send_message(msg)

def _send_sms_sync(to_phone: str, code: str, purpose: str):
    if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER):
        raise RuntimeError("Twilio SMS credentials are not configured")

    auth = base64.b64encode(f"{TWILIO_ACCOUNT_SID}:{TWILIO_AUTH_TOKEN}".encode()).decode()
    resp = requests.post(
        f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json",
        headers={"Authorization": f"Basic {auth}"},
        data={"From": TWILIO_FROM_NUMBER, "To": to_phone, "Body": _otp_message(code, purpose)},
        timeout=15,
    )
    if resp.status_code >= 400:
        raise RuntimeError(f"Twilio SMS failed: {resp.status_code} {resp.text[:200]}")

async def send_otp(to: str, code: str, otp_type: Literal["email", "phone"], purpose: str):
    if OTP_DEV_MODE:
        log.info("[OTP-DEV] %s %s=%s", to, otp_type, code)
        return

    try:
        if otp_type == "email":
            await asyncio.to_thread(_send_email_sync, to, code, purpose)
        else:
            await asyncio.to_thread(_send_sms_sync, to, code, purpose)
    except Exception as exc:
        log.exception("Failed to send %s OTP to %s", otp_type, to)
        raise HTTPException(502, f"Could not send {otp_type} OTP. Check OTP provider configuration.") from exc

def with_dev_otp(payload: dict, **codes) -> dict:
    if OTP_DEV_MODE:
        payload["otp_dev"] = codes
    return payload

def auth_payload(user: dict, access: str) -> dict:
    return {"user": public_user(user), "access_token": access, "token_type": "bearer"}

def _verify_google_token_sync(credential: str) -> dict:
    if not GOOGLE_CLIENT_ID:
        raise RuntimeError("GOOGLE_CLIENT_ID is not configured")
    resp = requests.get(
        "https://oauth2.googleapis.com/tokeninfo",
        params={"id_token": credential},
        timeout=15,
    )
    if resp.status_code >= 400:
        raise HTTPException(401, "Invalid Google credential")
    payload = resp.json()
    if payload.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(401, "Google credential audience mismatch")
    if payload.get("email_verified") not in (True, "true", "True", "1"):
        raise HTTPException(401, "Google email is not verified")
    return payload

async def verify_google_token(credential: str) -> dict:
    try:
        return await asyncio.to_thread(_verify_google_token_sync, credential)
    except HTTPException:
        raise
    except Exception as exc:
        log.exception("Google auth verification failed")
        raise HTTPException(502, "Could not verify Google account. Check Google auth configuration.") from exc

async def ensure_editor_profile(user: dict):
    existing = await db.editors.find_one({"user_id": user["id"]})
    if existing:
        return
    await db.editors.insert_one({
        "id": user["id"],
        "user_id": user["id"],
        "bio": "",
        "skills": [],
        "portfolio": [],
        "portfolio_links": {},
        "portfolio_videos": [],
        "proof_videos": [],
        "hourly_rate": None,
        "starting_price": None,
        "currency": "INR",
        "location": None,
        "languages": [],
        "software": [],
        "categories": [],
        "experience_level": None,
        "years_experience": None,
        "availability": None,
        "verification_status": "Pending Review",
        "avatar": user.get("avatar"),
        "is_public": False,
        "badges": [],
        "trust_score": {
            "completion_rate": 0,
            "response_rate": 0,
            "on_time_delivery_rate": 0,
            "satisfaction": 0,
        },
        "stats": {
            "projects_completed": 0,
            "total_reviews": 0,
            "avg_rating": 0,
        },
        "created_at": now_utc().isoformat(),
    })

def public_user(u: dict) -> dict:
    return {
        "id": u["id"], "email": u["email"], "name": u["name"], "phone": u.get("phone"),
        "role": u.get("role", "pending"), "email_verified": u.get("email_verified", False),
        "phone_verified": u.get("phone_verified", False),
        "avatar": u.get("avatar"), "created_at": u.get("created_at"),
        "status": u.get("status", "active"),
        "profile_completed": u.get("profile_completed", False),
        "onboarding_completed": u.get("onboarding_completed", False),
        "can_hire": u.get("can_hire", u.get("role") in ("client", "editor", "admin")),
        "can_edit": u.get("can_edit", u.get("role") in ("editor", "admin")),
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
ID_RE = r"^[0-9A-Za-z_-]{1,100}$"
TOKEN_RE = r"^[0-9A-Za-z._~+/=-]{16,4096}$"
SAFE_TEXT_RE = r"^[^\x00-\x08\x0b\x0c\x0e-\x1f\x7f<>]*$"
DATA_URL_RE = r"^data:[a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\r\n]+$"
DEADLINE_RE = r"^(24h|3d|5d|7d|10d|12d|14d|30d|\d{4}-\d{2}-\d{2})$"

UserId = Annotated[str, Field(min_length=1, max_length=100, pattern=ID_RE)]
ShortText = Annotated[str, Field(min_length=1, max_length=80, pattern=SAFE_TEXT_RE)]
MediumText = Annotated[str, Field(min_length=1, max_length=300, pattern=SAFE_TEXT_RE)]
LongText = Annotated[str, Field(min_length=1, max_length=3000, pattern=SAFE_TEXT_RE)]
OptionalText = Annotated[str, Field(min_length=0, max_length=1000, pattern=SAFE_TEXT_RE)]
PasswordText = Annotated[str, Field(min_length=8, max_length=128)]
PhoneText = Annotated[str, Field(min_length=8, max_length=16, pattern=r"^\+[1-9]\d{7,14}$")]
OtpText = Annotated[str, Field(min_length=6, max_length=6, pattern=r"^\d{6}$")]
TokenText = Annotated[str, Field(min_length=16, max_length=4096, pattern=TOKEN_RE)]
DataUrlText = Annotated[str, Field(min_length=22, max_length=12_000_000, pattern=DATA_URL_RE)]
DeadlineText = Annotated[str, Field(min_length=2, max_length=10, pattern=DEADLINE_RE)]
Money = Annotated[float, Field(ge=0, le=1_000_000)]
Rate = Annotated[float, Field(ge=0, le=10_000)]
SafeStringList = Annotated[List[ShortText], Field(min_length=0, max_length=30)]

class StrictBaseModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

class PortfolioItem(StrictBaseModel):
    title: ShortText
    thumbnail_b64: Optional[DataUrlText] = None
    url: Annotated[Optional[str], Field(default=None, min_length=0, max_length=500, pattern=r"^(|https?://[^\s<>]+)$")]
    description: Optional[OptionalText] = None

class RegisterIn(StrictBaseModel):
    name: ShortText
    email: EmailStr
    phone: PhoneText
    password: PasswordText
    role: Literal["pending", "client", "editor"] = "pending"

class LoginIn(StrictBaseModel):
    email: Annotated[str, Field(min_length=3, max_length=254, pattern=r"^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$|^\+[1-9]\d{7,14}$")]
    password: PasswordText
    remember_me: bool = False

class GoogleAuthIn(StrictBaseModel):
    credential: TokenText
    role: Literal["pending", "client", "editor"] = "pending"
    remember_me: bool = True

class OnboardingRoleIn(StrictBaseModel):
    role: Literal["client", "editor"]

class OnboardingProfileIn(StrictBaseModel):
    data: Dict[ShortText, Any] = Field(default_factory=dict, max_length=25)

    @field_validator("data")
    @classmethod
    def validate_data(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        allowed = {
            "avatar", "avatar_b64", "profile_name", "company", "bio", "creator_types", "video_types",
            "role_detail", "hire_frequency", "monthly_budget", "country", "languages", "timezone",
            "experience_level", "years_experience", "categories", "software", "hourly_rate",
            "starting_price", "currency", "social_links", "portfolio_links", "connected_accounts",
            "portfolio_videos", "availability",
        }
        if set(data) - allowed:
            raise ValueError("Unsupported onboarding profile fields")
        for key, value in data.items():
            if key in {"creator_types", "video_types", "categories", "software", "portfolio_videos", "languages"}:
                if not isinstance(value, list) or len(value) > 30 or not all(isinstance(v, str) and 1 <= len(v) <= 300 and not any(ch in v for ch in "\r\n<>") for v in value):
                    raise ValueError(f"{key} must be a list of safe strings")
            elif key in {"social_links", "portfolio_links", "connected_accounts"}:
                if not isinstance(value, dict) or len(value) > 20:
                    raise ValueError(f"{key} must be an object")
                for link_key, link_value in value.items():
                    if not isinstance(link_key, str) or not isinstance(link_value, str):
                        raise ValueError(f"{key} keys and values must be strings")
                    if len(link_key) > 80 or len(link_value) > 500 or any(ch in link_key + link_value for ch in "\r\n<>"):
                        raise ValueError(f"{key} contains an invalid string")
                    if link_value and not link_value.startswith(("http://", "https://")):
                        raise ValueError(f"{key} URLs must start with http:// or https://")
            elif key in {"hourly_rate", "starting_price"}:
                if value != "" and (not isinstance(value, (int, float)) or isinstance(value, bool) or value < 0 or value > 1_000_000):
                    raise ValueError(f"{key} must be a non-negative number")
            elif not isinstance(value, str) or len(value) > 3000 or any(ch in value for ch in "\r\n<>"):
                raise ValueError(f"{key} must be a safe string")
        return data

class VerifyOtpIn(StrictBaseModel):
    email: EmailStr
    otp: OtpText
    type: Literal["email", "phone"]

class VerifyLoginOtpIn(StrictBaseModel):
    email: EmailStr
    otp: OtpText
    remember_me: bool = False

class ResendOtpIn(StrictBaseModel):
    email: EmailStr
    type: Literal["email", "phone"]

class UpdatePhoneIn(StrictBaseModel):
    phone: PhoneText

class ForgotIn(StrictBaseModel):
    email: EmailStr

class ResetIn(StrictBaseModel):
    token: TokenText
    new_password: PasswordText

class EditorProfileIn(StrictBaseModel):
    bio: Optional[LongText] = None
    skills: Optional[SafeStringList] = None
    hourly_rate: Optional[Rate] = None
    starting_price: Optional[Money] = None
    portfolio: Optional[Annotated[List[PortfolioItem], Field(min_length=0, max_length=20)]] = None
    avatar_b64: Optional[DataUrlText] = None
    cover_b64: Optional[DataUrlText] = None
    location: Optional[ShortText] = None
    languages: Optional[SafeStringList] = None
    software: Optional[SafeStringList] = None

class ProjectRequestIn(StrictBaseModel):
    editor_id: UserId
    title: MediumText
    description: LongText
    content_type: ShortText
    editing_style: ShortText
    motion_graphics: bool
    footage_size: ShortText
    budget: Money
    deadline: DeadlineText

class MessageIn(StrictBaseModel):
    conversation_id: UserId
    text: Optional[LongText] = None
    attachment_b64: Optional[DataUrlText] = None
    attachment_type: Optional[Literal["image", "video", "file"]] = None
    attachment_name: Optional[ShortText] = None

    @model_validator(mode="after")
    def require_text_or_attachment(self):
        if not self.text and not self.attachment_b64:
            raise ValueError("Either text or attachment_b64 is required")
        if self.attachment_b64 and not self.attachment_type:
            raise ValueError("attachment_type is required with attachment_b64")
        return self

class ConversationStartIn(StrictBaseModel):
    user_id: UserId

class BlockUserIn(StrictBaseModel):
    user_id: UserId

class ReportIn(StrictBaseModel):
    target_user_id: UserId
    kind: Literal["profile", "scam", "spam", "fake_review", "other"]
    reason: LongText

class ReviewIn(StrictBaseModel):
    editor_id: UserId
    project_id: Optional[UserId] = None
    rating: int = Field(ge=1, le=5)
    comment: LongText

class StatusUpdateIn(StrictBaseModel):
    status: Literal["pending", "in_progress", "completed", "cancelled"]

class AdminActionIn(StrictBaseModel):
    action: Literal["approve", "reject", "suspend", "ban", "unban"]
    reason: Optional[LongText] = None

@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    try:
        email = body.email.lower().strip()
        phone = normalize_phone(body.phone)

        if await db.users.find_one({"email": email}):
            raise HTTPException(400, "Email already registered")

        if await db.users.find_one({"phone": phone}):
            raise HTTPException(400, "Phone already registered")

        uid = str(uuid.uuid4())

        user = {
            "id": uid,
            "name": body.name.strip(),
            "email": email,
            "phone": phone,
            "password_hash": hash_password(body.password),
            "role": "pending",
            "email_verified": True,
            "phone_verified": True,
            "profile_completed": False,
            "onboarding_completed": False,
            "can_hire": True,
            "can_edit": False,
            "status": "active",
            "created_at": now_utc().isoformat(),
            "avatar": None,
        }

        await db.users.insert_one(user)

        access = create_token(user["id"], user["role"], REMEMBER_TTL_MIN)
        refresh = create_token(user["id"], user["role"], REFRESH_TTL_DAYS * 1440, "refresh")
        set_auth_cookies(response, access, refresh, True)
        return auth_payload(user, access)

    except HTTPException:
        raise
    except Exception:
        log.exception("Registration failed")
        raise

@api.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    login_identifier = normalize_login_identifier(body.email)
    ip = client_ip(request)
    account_key = stable_key(login_identifier)

    user_query = {"email": login_identifier} if "@" in login_identifier else {"phone": login_identifier}
    user = await db.users.find_one(user_query)
    if not user or not verify_password(body.password, user["password_hash"]):
        await record_auth_failure(ip, account_key)
        raise HTTPException(401, "Invalid credentials")
    if user.get("status") == "banned":
        raise HTTPException(403, "Account banned")

    await clear_auth_backoff(ip, account_key)
    await db.login_attempts.delete_one({"identifier": f"{ip}:{login_identifier}"})
    if LOGIN_OTP_REQUIRED and user["role"] != "admin":
        account_email = user["email"]
        await db.otp_codes.update_many({"email": account_email, "type": "login", "used": False},
                                       {"$set": {"used": True}})
        code = gen_otp()
        expires = (now_utc() + timedelta(minutes=OTP_TTL_MIN)).isoformat()
        await db.otp_codes.insert_one({"user_id": user["id"], "email": account_email, "type": "login",
                                       "code": code, "expires_at": expires, "used": False})
        await send_otp(account_email, code, "email", "login")
        return with_dev_otp({"login_otp_required": True, "email": account_email}, login_otp=code)

    ttl = REMEMBER_TTL_MIN if body.remember_me else ACCESS_TTL_MIN
    access = create_token(user["id"], user["role"], ttl)
    refresh = create_token(user["id"], user["role"], REFRESH_TTL_DAYS*1440, "refresh")
    set_auth_cookies(response, access, refresh, body.remember_me)
    return auth_payload(user, access)

@api.post("/auth/google")
async def google_auth(body: GoogleAuthIn, response: Response):
    google_user = await verify_google_token(body.credential)
    email = google_user["email"].lower().strip()
    google_sub = google_user["sub"]
    name = (google_user.get("name") or email.split("@")[0]).strip()
    avatar = google_user.get("picture")

    user = await db.users.find_one({"email": email})
    if user:
        if user.get("status") == "banned":
            raise HTTPException(403, "Account banned")
        updates = {
            "google_sub": google_sub,
            "email_verified": True,
            "auth_provider": user.get("auth_provider") or "google",
        }
        if avatar and not user.get("avatar"):
            updates["avatar"] = avatar
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
        user = await db.users.find_one({"id": user["id"]})
    else:
        user = {
            "id": str(uuid.uuid4()),
            "name": name,
            "email": email,
            "phone": None,
            "password_hash": "",
            "role": "pending",
            "email_verified": True,
            "phone_verified": False,
            "profile_completed": False,
            "onboarding_completed": False,
            "can_hire": True,
            "can_edit": False,
            "status": "active",
            "created_at": now_utc().isoformat(),
            "avatar": avatar,
            "google_sub": google_sub,
            "auth_provider": "google",
        }
        await db.users.insert_one(user)

    access = create_token(user["id"], user["role"], REMEMBER_TTL_MIN if body.remember_me else ACCESS_TTL_MIN)
    refresh = create_token(user["id"], user["role"], REFRESH_TTL_DAYS * 1440, "refresh")
    set_auth_cookies(response, access, refresh, body.remember_me)
    return auth_payload(user, access)

@api.post("/auth/verify-login-otp")
async def verify_login_otp(body: VerifyLoginOtpIn, response: Response):
    email = body.email.lower().strip()
    rec = await db.otp_codes.find_one({"email": email, "type": "login", "used": False}, sort=[("expires_at", -1)])
    if not rec:
        raise HTTPException(400, "No active login OTP")
    if datetime.fromisoformat(rec["expires_at"]) < now_utc():
        raise HTTPException(400, "OTP expired")
    if rec["code"] != body.otp:
        raise HTTPException(400, "Invalid OTP")

    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(404, "User not found")
    if user.get("status") == "banned":
        raise HTTPException(403, "Account banned")

    await db.otp_codes.update_one({"_id": rec["_id"]}, {"$set": {"used": True}})
    ttl = REMEMBER_TTL_MIN if body.remember_me else ACCESS_TTL_MIN
    access = create_token(user["id"], user["role"], ttl)
    refresh = create_token(user["id"], user["role"], REFRESH_TTL_DAYS*1440, "refresh")
    set_auth_cookies(response, access, refresh, body.remember_me)
    return auth_payload(user, access)

@api.post("/auth/resend-login-otp")
async def resend_login_otp(body: ForgotIn):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        return {"ok": True}
    if user.get("status") == "banned":
        raise HTTPException(403, "Account banned")

    await db.otp_codes.update_many({"email": email, "type": "login", "used": False},
                                   {"$set": {"used": True}})
    code = gen_otp()
    expires = (now_utc() + timedelta(minutes=OTP_TTL_MIN)).isoformat()
    await db.otp_codes.insert_one({"user_id": user["id"], "email": email, "type": "login",
                                   "code": code, "expires_at": expires, "used": False})
    await send_otp(email, code, "email", "login")
    return with_dev_otp({"ok": True}, login_otp=code)

@api.post("/auth/upgrade-to-editor")
async def upgrade_to_editor(user=Depends(get_current_user)):
    """Allow an already-logged-in client to become an editor without re-signup."""
    if user["role"] == "editor":
        return {"ok": True, "already_editor": True}
    if user["role"] == "admin":
        raise HTTPException(400, "Admins cannot be downgraded to editor")
    await db.users.update_one({"id": user["id"]}, {"$set": {"role": "editor"}})
    existing = await db.editors.find_one({"user_id": user["id"]})
    if not existing:
        await db.editors.insert_one({
            "id": user["id"], "user_id": user["id"], "bio": "", "skills": [], "portfolio": [],
            "hourly_rate": None, "starting_price": None, "location": None,
            "languages": [], "software": [], "avatar": user.get("avatar"),
            "is_public": False, "badges": [],
            "trust_score": {"completion_rate": 0, "response_rate": 0,
                            "on_time_delivery_rate": 0, "satisfaction": 0},
            "stats": {"projects_completed": 0, "total_reviews": 0, "avg_rating": 0},
            "created_at": now_utc().isoformat(),
        })
    return {"ok": True}

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

@api.put("/auth/phone")
async def update_phone(body: UpdatePhoneIn, user=Depends(get_current_user)):
    phone = normalize_phone(body.phone)
    if not phone or len(phone.replace("+", "")) < 7:
        raise HTTPException(400, "Enter a valid phone number")

    existing = await db.users.find_one({"phone": phone, "id": {"$ne": user["id"]}})
    if existing:
        raise HTTPException(400, "Phone already registered")

    await db.otp_codes.update_many({"email": user["email"], "type": "phone", "used": False},
                                   {"$set": {"used": True}})
    await db.users.update_one({"id": user["id"]}, {"$set": {"phone": phone, "phone_verified": False}})
    updated = await db.users.find_one({"id": user["id"]})
    return public_user(updated)

@api.get("/onboarding/me")
async def onboarding_me(user=Depends(get_current_user)):
    client_profile = await db.client_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    editor_profile = await db.editors.find_one({"user_id": user["id"]}, {"_id": 0})
    return {
        "user": public_user(user),
        "client_profile": client_profile,
        "editor_profile": editor_profile,
    }

@api.post("/onboarding/role")
async def onboarding_role(body: OnboardingRoleIn, response: Response, user=Depends(get_current_user)):
    updates = {
        "role": body.role,
        "can_hire": True,
        "can_edit": body.role == "editor",
        "onboarding_started": True,
        "updated_at": now_utc().isoformat(),
    }
    await db.users.update_one({"id": user["id"]}, {"$set": updates})
    user = {**user, **updates}
    if body.role == "editor":
        await ensure_editor_profile(user)
    else:
        await db.client_profiles.update_one(
            {"user_id": user["id"]},
            {"$setOnInsert": {"user_id": user["id"], "created_at": now_utc().isoformat()},
             "$set": {"updated_at": now_utc().isoformat()}},
            upsert=True,
        )
    access = create_token(user["id"], body.role, ACCESS_TTL_MIN)
    refresh = create_token(user["id"], body.role, REFRESH_TTL_DAYS * 1440, "refresh")
    set_auth_cookies(response, access, refresh, False)
    return auth_payload(user, access)

@api.put("/onboarding/profile")
async def onboarding_profile(body: OnboardingProfileIn, user=Depends(get_current_user)):
    if user.get("role") not in ("client", "editor"):
        raise HTTPException(400, "Choose a role first")
    data = dict(body.data or {})
    avatar = data.get("avatar") or data.get("avatar_b64")
    if avatar:
        await db.users.update_one({"id": user["id"]}, {"$set": {"avatar": avatar}})
    data["updated_at"] = now_utc().isoformat()
    if user["role"] == "client":
        data["user_id"] = user["id"]
        await db.client_profiles.update_one(
            {"user_id": user["id"]},
            {"$setOnInsert": {"created_at": now_utc().isoformat()}, "$set": data},
            upsert=True,
        )
        return {"ok": True, "client_profile": await db.client_profiles.find_one({"user_id": user["id"]}, {"_id": 0})}
    await ensure_editor_profile(user)
    data.setdefault("verification_status", "Pending Review")
    await db.editors.update_one({"user_id": user["id"]}, {"$set": data})
    return {"ok": True, "editor_profile": await db.editors.find_one({"user_id": user["id"]}, {"_id": 0})}

@api.post("/onboarding/complete")
async def onboarding_complete(user=Depends(get_current_user)):
    if user.get("role") not in ("client", "editor"):
        raise HTTPException(400, "Choose a role first")
    if user["role"] == "editor":
        await db.editors.update_one(
            {"user_id": user["id"]},
            {"$set": {"verification_status": "Pending Verification", "is_public": False, "updated_at": now_utc().isoformat()}},
        )
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"profile_completed": True, "onboarding_completed": True, "updated_at": now_utc().isoformat()}},
    )
    updated = await db.users.find_one({"id": user["id"]})
    return {"user": public_user(updated)}

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
        response.set_cookie("access_token", access, httponly=True, secure=COOKIE_SECURE,
                            samesite=COOKIE_SAMESITE, max_age=ACCESS_TTL_MIN*60, path="/", domain=COOKIE_DOMAIN)
        return {"ok": True}
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid refresh token")

@api.post("/auth/verify-otp")
async def verify_otp(body: VerifyOtpIn, response: Response):
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
    user = await db.users.find_one({"email": email})
    if user and user.get("email_verified") and user.get("phone_verified"):
        access = create_token(user["id"], user["role"], ACCESS_TTL_MIN)
        refresh = create_token(user["id"], user["role"], REFRESH_TTL_DAYS * 1440, "refresh")
        set_auth_cookies(response, access, refresh, False)
        return {"ok": True, "verified": body.type, **auth_payload(user, access)}
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
    destination = email if body.type == "email" else user.get("phone")
    await send_otp(destination, code, body.type, "verification")
    return with_dev_otp({"ok": True}, otp=code)

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
    if OTP_DEV_MODE:
        log.info(f"[RESET] {email} reset_token={token}")
        return {"ok": True, "reset_token_dev": token}
    return {"ok": True}

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
async def list_editors(
    skill: Annotated[Optional[str], Query(min_length=1, max_length=80, pattern=SAFE_TEXT_RE)] = None,
    badge: Annotated[Optional[str], Query(min_length=1, max_length=80, pattern=SAFE_TEXT_RE)] = None,
    min_price: Annotated[Optional[float], Query(ge=0, le=1_000_000)] = None,
    max_price: Annotated[Optional[float], Query(ge=0, le=1_000_000)] = None,
    q: Annotated[Optional[str], Query(min_length=1, max_length=80, pattern=SAFE_TEXT_RE)] = None,
):
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
async def get_editor(editor_id: Annotated[str, ApiPath(min_length=1, max_length=100, pattern=ID_RE)]):
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
async def start_conversation(payload: ConversationStartIn, user=Depends(get_current_user)):
    other = payload.user_id
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
async def list_messages(conv_id: Annotated[str, ApiPath(min_length=1, max_length=100, pattern=ID_RE)], user=Depends(get_current_user)):
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
async def ws_endpoint(websocket: WebSocket, token: Annotated[Optional[str], Query(min_length=16, max_length=4096, pattern=TOKEN_RE)] = None):
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
async def update_project_status(pid: Annotated[str, ApiPath(min_length=1, max_length=100, pattern=ID_RE)], body: StatusUpdateIn, user=Depends(get_current_user)):
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
    # Preserve verified badge only if editor was already eligible (controlled by PUT /editors/me)
    existing = await db.editors.find_one({"id": editor_id}) or {}
    badges = ["verified"] if "verified" in (existing.get("badges") or []) else []
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
async def block_user(payload: BlockUserIn, user=Depends(get_current_user)):
    target = payload.user_id
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
async def admin_report_action(rid: Annotated[str, ApiPath(min_length=1, max_length=100, pattern=ID_RE)], body: AdminActionIn, user=Depends(require_admin)):
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
async def admin_user_action(uid: Annotated[str, ApiPath(min_length=1, max_length=100, pattern=ID_RE)], body: AdminActionIn, user=Depends(require_admin)):
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
async def admin_delete_review(rid: Annotated[str, ApiPath(min_length=1, max_length=100, pattern=ID_RE)], user=Depends(require_admin)):
    r = await db.reviews.find_one({"id": rid})
    if not r: raise HTTPException(404, "Not found")
    await db.reviews.delete_one({"id": rid})
    await recompute_trust(r["editor_id"])
    return {"ok": True}

# ------------------------------- Applications + Public projects ---------
class PublicProjectIn(StrictBaseModel):
    title: MediumText
    description: LongText
    content_type: ShortText
    editing_style: ShortText
    motion_graphics: bool
    footage_size: ShortText
    budget: Money
    deadline: DeadlineText

class ApplyIn(StrictBaseModel):
    project_id: UserId
    proposal: LongText
    proposed_budget: Optional[Money] = None
    proposed_deadline: Optional[DeadlineText] = None

@api.post("/projects/public")
async def create_public_project(body: PublicProjectIn, user=Depends(get_current_user)):
    """Client posts a project openly. Editors can then apply."""
    if user["role"] != "client":
        raise HTTPException(403, "Only clients can post projects")
    proj = {
        "id": str(uuid.uuid4()), "client_id": user["id"], "editor_id": None,
        "title": body.title, "description": body.description,
        "content_type": body.content_type, "editing_style": body.editing_style,
        "motion_graphics": body.motion_graphics, "footage_size": body.footage_size,
        "budget": body.budget, "deadline": body.deadline,
        "status": "open", "created_at": now_utc().isoformat(),
        "public": True, "applications_count": 0,
    }
    await db.projects.insert_one(proj.copy())
    proj.pop("_id", None)
    return proj

@api.get("/projects/public")
async def list_public_projects(user=Depends(get_current_user)):
    """Editors browse open projects."""
    if user["role"] != "editor":
        raise HTTPException(403, "Editor role required")
    projs = await db.projects.find({"public": True, "status": "open"}, {"_id": 0}).sort("created_at", -1).to_list(200)
    # Mark which ones this editor already applied to
    applied = {a["project_id"] async for a in db.applications.find({"editor_id": user["id"]}, {"project_id": 1, "_id": 0})}
    for p in projs: p["already_applied"] = p["id"] in applied
    return projs

@api.post("/applications")
async def apply_to_project(body: ApplyIn, user=Depends(get_current_user)):
    if user["role"] != "editor":
        raise HTTPException(403, "Editor role required")
    proj = await db.projects.find_one({"id": body.project_id})
    if not proj or proj.get("status") != "open":
        raise HTTPException(404, "Project not available")
    existing = await db.applications.find_one({"project_id": body.project_id, "editor_id": user["id"]})
    if existing:
        raise HTTPException(400, "Already applied")
    app_doc = {
        "id": str(uuid.uuid4()), "project_id": body.project_id,
        "editor_id": user["id"], "editor_name": user["name"],
        "client_id": proj["client_id"], "proposal": body.proposal,
        "proposed_budget": body.proposed_budget, "proposed_deadline": body.proposed_deadline,
        "status": "pending", "created_at": now_utc().isoformat(),
    }
    await db.applications.insert_one(app_doc.copy())
    await db.projects.update_one({"id": body.project_id}, {"$inc": {"applications_count": 1}})
    app_doc.pop("_id", None)
    return app_doc

@api.get("/applications/project/{project_id}")
async def list_applications_for_project(project_id: Annotated[str, ApiPath(min_length=1, max_length=100, pattern=ID_RE)], user=Depends(get_current_user)):
    proj = await db.projects.find_one({"id": project_id})
    if not proj: raise HTTPException(404, "Project not found")
    if user["id"] != proj["client_id"] and user["role"] != "admin":
        raise HTTPException(403, "Only the project owner can view applications")
    apps = await db.applications.find({"project_id": project_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    # Enrich with editor profile
    editor_ids = [a["editor_id"] for a in apps]
    editors = {e["id"]: e async for e in db.editors.find({"id": {"$in": editor_ids}}, {"_id": 0})}
    for a in apps:
        e = editors.get(a["editor_id"]) or {}
        a["editor_profile"] = {
            "avatar": e.get("avatar"), "bio": e.get("bio"), "badges": e.get("badges", []),
            "starting_price": e.get("starting_price"), "skills": e.get("skills", []),
            "trust_score": e.get("trust_score", {}),
        }
    return apps

@api.get("/applications/mine")
async def list_my_applications(user=Depends(get_current_user)):
    if user["role"] != "editor":
        raise HTTPException(403, "Editor role required")
    apps = await db.applications.find({"editor_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    project_ids = [a["project_id"] for a in apps]
    projs = {p["id"]: p async for p in db.projects.find({"id": {"$in": project_ids}}, {"_id": 0})}
    for a in apps: a["project"] = projs.get(a["project_id"])
    return apps

@api.post("/applications/{app_id}/accept")
async def accept_application(app_id: Annotated[str, ApiPath(min_length=1, max_length=100, pattern=ID_RE)], user=Depends(get_current_user)):
    """Client accepts → auto-create workspace: assign editor to project, open conversation, send system message."""
    app_doc = await db.applications.find_one({"id": app_id})
    if not app_doc: raise HTTPException(404, "Application not found")
    if app_doc["client_id"] != user["id"]:
        raise HTTPException(403, "Only the client can accept")
    if app_doc["status"] != "pending":
        raise HTTPException(400, f"Application already {app_doc['status']}")
    proj = await db.projects.find_one({"id": app_doc["project_id"]})
    if not proj or proj.get("status") != "open":
        raise HTTPException(400, "Project no longer open")

    # 1) Mark this app accepted, decline others on same project
    await db.applications.update_one({"id": app_id},
        {"$set": {"status": "accepted", "accepted_at": now_utc().isoformat()}})
    await db.applications.update_many(
        {"project_id": app_doc["project_id"], "id": {"$ne": app_id}, "status": "pending"},
        {"$set": {"status": "declined", "auto_declined": True}})

    # 2) Assign editor and move project to in_progress
    await db.projects.update_one({"id": app_doc["project_id"]},
        {"$set": {"editor_id": app_doc["editor_id"], "status": "in_progress",
                  "accepted_at": now_utc().isoformat()}})

    # 3) Open conversation between client + editor
    conv = await get_or_create_conversation(app_doc["client_id"], app_doc["editor_id"])

    # 4) System message
    sys_msg = {
        "id": str(uuid.uuid4()), "conversation_id": conv["id"],
        "sender_id": app_doc["client_id"],
        "text": f"🎬 Project '{proj['title']}' has started. Welcome to your private workspace.",
        "attachment_b64": None, "attachment_type": None, "attachment_name": None,
        "created_at": now_utc().isoformat(), "read": False,
        "system": True, "project_id": proj["id"],
    }
    await db.messages.insert_one(sys_msg.copy())
    await db.conversations.update_one({"id": conv["id"]},
        {"$set": {"last_message": sys_msg["text"], "last_message_at": sys_msg["created_at"],
                  "project_id": proj["id"]}})
    sys_msg.pop("_id", None)
    await manager.broadcast_conversation(conv["id"], {"event": "message", "data": sys_msg})

    return {"ok": True, "project_id": proj["id"], "conversation_id": conv["id"]}

@api.post("/applications/{app_id}/decline")
async def decline_application(app_id: Annotated[str, ApiPath(min_length=1, max_length=100, pattern=ID_RE)], user=Depends(get_current_user)):
    app_doc = await db.applications.find_one({"id": app_id})
    if not app_doc: raise HTTPException(404, "Application not found")
    if app_doc["client_id"] != user["id"]:
        raise HTTPException(403, "Only the client can decline")
    await db.applications.update_one({"id": app_id}, {"$set": {"status": "declined"}})
    return {"ok": True}

# ------------------------------- AI Match -----------------------------
class AIMatchIn(StrictBaseModel):
    content_type: ShortText
    budget: Money
    deadline: DeadlineText
    editing_style: ShortText
    motion_graphics: bool
    footage_size: ShortText

@api.post("/ai/match")
async def ai_match(body: AIMatchIn, user=Depends(get_current_user)):
    """Use Claude Sonnet to rank public editors based on project criteria."""
    editors = await db.editors.find({"is_public": True}, {"_id": 0}).to_list(200)
    if not editors:
        return {"matches": [], "note": "No public editors available yet."}

    # Join names
    user_ids = [e["user_id"] for e in editors]
    users = {u["id"]: u async for u in db.users.find({"id": {"$in": user_ids}}, {"_id": 0})}
    editor_summaries = []
    for e in editors:
        u = users.get(e["user_id"]) or {}
        editor_summaries.append({
            "id": e["id"], "name": u.get("name"),
            "bio": (e.get("bio") or "")[:300],
            "skills": e.get("skills", []), "software": e.get("software", []),
            "badges": e.get("badges", []), "starting_price": e.get("starting_price"),
            "trust_score": e.get("trust_score", {}),
            "stats": e.get("stats", {}),
        })

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        llm_key = os.environ["EMERGENT_LLM_KEY"]
        system = (
            "You are EditCol's AI matchmaker. You receive project criteria and a list of editor profiles. "
            "Rank up to 6 best matches. Respond with STRICT JSON only: "
            '{"matches":[{"editor_id":"<id>","score":<0-100>,"reason":"<one short sentence>"}]}. '
            "Consider: relevance of skills + style + content type, badges (verified/pro/top_rated/elite carry weight), "
            "starting price vs budget, trust score, motion graphics requirement, and turnaround feasibility for the deadline. "
            "Do not include editors who clearly cannot meet the budget or skill needs."
        )
        chat = LlmChat(
            api_key=llm_key, session_id=f"match-{user['id']}-{uuid.uuid4().hex[:6]}",
            system_message=system,
        ).with_model("anthropic", "claude-sonnet-4-6")
        prompt = json.dumps({
            "criteria": body.model_dump(),
            "editors": editor_summaries,
        }, default=str)
        resp = await chat.send_message(UserMessage(text=prompt))
        raw = str(resp).strip()
        # extract JSON
        start = raw.find("{"); end = raw.rfind("}")
        if start == -1 or end == -1: raise ValueError("No JSON in response")
        parsed = json.loads(raw[start:end+1])
        match_list = parsed.get("matches", [])
    except Exception as ex:
        log.warning(f"AI match fallback (LLM error: {ex})")
        # Fallback: deterministic ranking
        match_list = []
        for e in editor_summaries[:6]:
            score = 50
            if e["starting_price"] and e["starting_price"] <= body.budget: score += 15
            score += min(20, 5 * len(set(e["skills"]) & {body.content_type, body.editing_style}))
            for b in e["badges"]: score += {"verified": 5, "pro": 8, "top_rated": 12, "elite": 18}.get(b, 0)
            match_list.append({"editor_id": e["id"], "score": min(100, score),
                              "reason": f"{', '.join(e['badges']) or 'Verified profile'} · within budget"})
        match_list.sort(key=lambda x: -x["score"])

    # Enrich with full editor cards
    by_id = {e["id"]: e for e in editor_summaries}
    full = []
    for m in match_list[:6]:
        e = by_id.get(m["editor_id"])
        if not e: continue
        editor_doc = next((x for x in editors if x["id"] == e["id"]), None)
        full.append({
            "id": e["id"], "name": e["name"],
            "avatar": (editor_doc or {}).get("avatar"),
            "bio": e["bio"], "skills": e["skills"],
            "badges": e["badges"], "starting_price": e["starting_price"],
            "trust_score": e["trust_score"], "stats": e["stats"],
            "score": m.get("score", 0), "reason": m.get("reason", ""),
        })
    return {"matches": full}

# ------------------------------- Root -----------------------------------
@api.get("/")
async def root():
    return {"app": "EditCol V2", "status": "ok"}

@api.get("/health")
async def health():
    return {"status": "healthy", "time": now_utc().isoformat()}

app.include_router(api)

default_origins = "https://editcol.com,https://www.editcol.com,http://localhost:3000,http://127.0.0.1:3000"
origins = [origin.strip() for origin in os.environ.get('CORS_ORIGINS', default_origins).split(',') if origin.strip()]
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
    await db.client_profiles.create_index("user_id", unique=True)
    await db.otp_codes.create_index("email")
    await db.password_reset_tokens.create_index("token", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.rate_limits.create_index("key", unique=True)
    await db.rate_limits.create_index("expires_at")
    await db.auth_rate_backoffs.create_index("key", unique=True)
    await db.auth_rate_backoffs.create_index("expires_at")
    await db.conversations.create_index("participants")
    await db.messages.create_index("conversation_id")
    await db.projects.create_index("client_id")
    await db.projects.create_index("editor_id")
    await db.reports.create_index("status")
    await db.reviews.create_index("editor_id")
    await db.applications.create_index("project_id")
    await db.applications.create_index("editor_id")

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
            "can_hire": True, "can_edit": True,
            "profile_completed": True, "onboarding_completed": True,
            "created_at": now_utc().isoformat(),
        })
        log.info(f"Admin seeded: {email}")
    elif not verify_password(pw, existing["password_hash"]):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(pw)}})
        log.info(f"Admin password updated: {email}")

@app.on_event("shutdown")
async def shutdown():
    client.close()

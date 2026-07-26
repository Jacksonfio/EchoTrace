"""
EchoTrace AI - Authentication Microservice
===========================================
Python-based auth service for signup, signin, and token verification.
The Express backend validates tokens by calling this service's /verify endpoint.

Run:  uvicorn main:app --reload --port 8000
"""

import os
import sqlite3
import json
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# ── Config ──
JWT_SECRET = os.getenv("JWT_SECRET", "echotrace-dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 168  # 7 days
DB_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DB_DIR / "echotrace.db"

app = FastAPI(title="EchoTrace Auth Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Database ──

def get_db() -> sqlite3.Connection:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    return conn


# ── Models ──

class SignupRequest(BaseModel):
    email: str
    password: str
    name: str

class SigninRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    success: bool
    data: dict

class VerifyResponse(BaseModel):
    success: bool
    data: dict | None = None
    error: str | None = None

class GoogleSigninRequest(BaseModel):
    email: str
    name: str
    google_id: str


# ── Helpers ──

def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def _verify_password(password: str, hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), hash.encode())

def _create_token(user: dict) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "jti": str(uuid.uuid4()),
        "exp": now + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": now,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def _decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


# ── Routes ──

@app.get("/health")
def health():
    return {"status": "ok", "service": "echotrace-auth", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/signup", response_model=TokenResponse)
def signup(req: SignupRequest):
    conn = get_db()
    try:
        # Check existing user
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")

        # Create user
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        password_hash = _hash_password(req.password)

        conn.execute(
            "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, req.email, req.name, password_hash, now),
        )
        conn.commit()

        user = {"id": user_id, "email": req.email, "name": req.name}
        token = _create_token(user)

        return {"success": True, "data": {"user": user, "token": token}}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/signin", response_model=TokenResponse)
def signin(req: SigninRequest):
    conn = get_db()
    try:
        row = conn.execute("SELECT id, email, name, password_hash FROM users WHERE email = ?", (req.email,)).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user = {"id": row["id"], "email": row["email"], "name": row["name"]}

        if not _verify_password(req.password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token = _create_token(user)
        return {"success": True, "data": {"user": user, "token": token}}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/verify", response_model=VerifyResponse)
def verify(token_data: dict):
    token = token_data.get("token", "")
    if not token:
        return {"success": False, "error": "Token is required"}

    try:
        payload = _decode_token(token)
        return {
            "success": True,
            "data": {
                "id": payload["id"],
                "email": payload["email"],
                "name": payload["name"],
            },
        }
    except jwt.ExpiredSignatureError:
        return {"success": False, "error": "Token has expired"}
    except jwt.InvalidTokenError as e:
        return {"success": False, "error": f"Invalid token: {str(e)}"}


@app.post("/refresh", response_model=TokenResponse)
def refresh(token_data: dict):
    """Generate a new token from an existing valid token."""
    token = token_data.get("token", "")
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")

    try:
        payload = _decode_token(token)
        user = {"id": payload["id"], "email": payload["email"], "name": payload["name"]}
        new_token = _create_token(user)
        return {"success": True, "data": {"user": user, "token": new_token}}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


@app.post("/auth/google", response_model=TokenResponse)
def google_auth(req: GoogleSigninRequest):
    """
    Google OAuth sign-in/sign-up.
    In production, the frontend sends an ID token from Google's OAuth client,
    which this endpoint verifies. For MVP, we accept a pre-verified email + name.
    """
    conn = get_db()
    try:
        # Check if user exists with this email
        row = conn.execute(
            "SELECT id, email, name FROM users WHERE email = ?",
            (req.email,),
        ).fetchone()

        if row:
            # Existing user — return token
            user = {"id": row["id"], "email": row["email"], "name": row["name"]}
        else:
            # New user — create account
            user_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            # Use a placeholder password hash (Google users don't have passwords)
            placeholder_hash = bcrypt.hashpw(os.urandom(32), bcrypt.gensalt()).decode()

            conn.execute(
                "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
                (user_id, req.email, req.name, placeholder_hash, now),
            )
            conn.commit()
            user = {"id": user_id, "email": req.email, "name": req.name}

        token = _create_token(user)
        return {"success": True, "data": {"user": user, "token": token}}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

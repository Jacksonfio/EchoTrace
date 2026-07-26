"""
EchoTrace Auth Service — Test Configuration
============================================
Uses a temporary SQLite database to avoid mutating the production database.
"""

import os
import sys
import tempfile
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
import pytest
from starlette.testclient import TestClient

# ── Set test environment BEFORE importing the app ──
TEST_DB_DIR = Path(tempfile.gettempdir()) / "echotrace-test"
TEST_DB_PATH = TEST_DB_DIR / "test-echotrace.db"

# Override DB path before any app module code runs
os.environ["_ECHOTRACE_TEST_DB_PATH"] = str(TEST_DB_PATH)

# Now import the app (it will read the env var via monkey-patched path below)
# We'll monkey-patch the module-level DB_PATH after import
import main as auth_app_module

# Monkey-patch the app's DB_PATH to use test database
auth_app_module.DB_DIR = TEST_DB_DIR
auth_app_module.DB_PATH = TEST_DB_PATH

# Use a fixed JWT secret for tests
auth_app_module.JWT_SECRET = "test-secret-for-testing-only"
JWT_SECRET = "test-secret-for-testing-only"


@pytest.fixture(autouse=True)
def setup_test_db():
    """Create a fresh test database before each test and clean up after."""
    TEST_DB_DIR.mkdir(parents=True, exist_ok=True)
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()
    # Reinitialize the database by calling get_db which triggers CREATE TABLE
    conn = auth_app_module.get_db()
    conn.close()
    yield
    # Clean up test database files
    for f in TEST_DB_DIR.glob("test-echotrace*"):
        try:
            f.unlink()
        except PermissionError:
            pass


@pytest.fixture
def client():
    """FastAPI TestClient pointing to the auth app."""
    with TestClient(auth_app_module.app) as c:
        yield c


@pytest.fixture
def sample_user():
    """Create a sample user in the test database and return credentials + token."""
    email = f"test-{uuid.uuid4().hex[:8]}@example.com"
    password = "SecurePass123!"
    name = "Test User"

    # Sign up via the app
    client_ = TestClient(auth_app_module.app)
    resp = client_.post("/signup", json={"email": email, "password": password, "name": name})
    data = resp.json()
    assert resp.status_code == 200
    return {
        "email": email,
        "password": password,
        "name": name,
        "user_id": data["data"]["user"]["id"],
        "token": data["data"]["token"],
    }


@pytest.fixture
def expired_token():
    """Create a token that has already expired."""
    payload = {
        "id": str(uuid.uuid4()),
        "email": "expired@example.com",
        "name": "Expired User",
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),  # 1 hour ago
        "iat": datetime.now(timezone.utc) - timedelta(hours=2),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

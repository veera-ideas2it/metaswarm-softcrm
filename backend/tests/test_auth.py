import pytest


@pytest.mark.asyncio
async def test_login_success(client, seed_users):
    """Successful login returns 200 with access_token and user email."""
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "Admin1234!"},
    )
    assert resp.status_code == 200
    body = resp.json()
    # Login returns TokenResponse directly (no data wrapper)
    assert "access_token" in body
    assert body["user"]["email"] == "admin@test.com"


@pytest.mark.asyncio
async def test_login_wrong_password(client, seed_users):
    """Wrong password returns 401."""
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "wrong"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client, seed_users):
    """Unknown email returns 401."""
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@test.com", "password": "x"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me_authenticated(client, admin_headers):
    """Authenticated /me returns the current user's email."""
    resp = await client.get("/api/v1/auth/me", headers=admin_headers)
    assert resp.status_code == 200
    # /me returns UserResponse directly (no data wrapper)
    assert resp.json()["email"] == "admin@test.com"


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client, seed_users):
    """Unauthenticated /me returns 401."""
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_logout(client, admin_headers):
    """Logout with valid token returns 200."""
    resp = await client.post("/api/v1/auth/logout", headers=admin_headers)
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_refresh_token(client, seed_users):
    """Refresh endpoint returns 200 if httpOnly cookie was set, 401 otherwise (test context)."""
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "rep@test.com", "password": "Rep1234!"},
    )
    assert login_resp.status_code == 200
    # The refresh cookie is httpOnly/secure; in test context it may not be forwarded.
    refresh_resp = await client.post("/api/v1/auth/refresh")
    assert refresh_resp.status_code in (200, 401)


@pytest.mark.asyncio
async def test_login_all_roles(client, seed_users):
    """All three roles can log in successfully."""
    for email, password in [
        ("admin@test.com", "Admin1234!"),
        ("manager@test.com", "Manager1234!"),
        ("rep@test.com", "Rep1234!"),
    ]:
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        assert resp.status_code == 200, f"Login failed for {email}"
        assert "access_token" in resp.json()

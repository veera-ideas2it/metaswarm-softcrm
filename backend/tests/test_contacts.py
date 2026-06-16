import pytest
import uuid


@pytest.mark.asyncio
async def test_create_contact(client, admin_headers, seed_company):
    """Admin can create a contact; returns 201 with contact data in 'data'."""
    resp = await client.post(
        "/api/v1/contacts",
        headers=admin_headers,
        json={
            "company_id": str(seed_company.id),
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@test.com",
        },
    )
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"


@pytest.mark.asyncio
async def test_list_contacts_requires_auth(client, seed_users):
    """GET /contacts without auth returns 401."""
    resp = await client.get("/api/v1/contacts")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_list_contacts(client, admin_headers, seed_company):
    """Listing contacts returns paginated response with 'data' and 'meta'."""
    resp = await client.get("/api/v1/contacts", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "data" in body
    assert "meta" in body
    assert isinstance(body["data"], list)


@pytest.mark.asyncio
async def test_list_contacts_search(client, admin_headers, seed_company):
    """Search by name fragment returns matching contacts."""
    await client.post(
        "/api/v1/contacts",
        headers=admin_headers,
        json={
            "company_id": str(seed_company.id),
            "first_name": "Jane",
            "last_name": "Smith",
        },
    )
    resp = await client.get("/api/v1/contacts?q=jane", headers=admin_headers)
    assert resp.status_code == 200
    names = [c["first_name"] for c in resp.json()["data"]]
    assert "Jane" in names


@pytest.mark.asyncio
async def test_decision_maker_filter(client, admin_headers, seed_company):
    """Filter by is_decision_maker=true returns only decision makers."""
    await client.post(
        "/api/v1/contacts",
        headers=admin_headers,
        json={
            "company_id": str(seed_company.id),
            "first_name": "DM",
            "last_name": "User",
            "is_decision_maker": True,
        },
    )
    resp = await client.get(
        "/api/v1/contacts?is_decision_maker=true", headers=admin_headers
    )
    assert resp.status_code == 200
    contacts = resp.json()["data"]
    assert len(contacts) > 0
    assert all(c["is_decision_maker"] for c in contacts)


@pytest.mark.asyncio
async def test_get_contact_by_id(client, admin_headers, seed_company):
    """Fetching a contact by ID returns it inside 'data'."""
    create_resp = await client.post(
        "/api/v1/contacts",
        headers=admin_headers,
        json={
            "company_id": str(seed_company.id),
            "first_name": "Fetch",
            "last_name": "Me",
        },
    )
    contact_id = create_resp.json()["data"]["id"]

    resp = await client.get(f"/api/v1/contacts/{contact_id}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["id"] == contact_id


@pytest.mark.asyncio
async def test_get_contact_not_found(client, admin_headers):
    """Fetching a non-existent contact returns 404."""
    resp = await client.get(f"/api/v1/contacts/{uuid.uuid4()}", headers=admin_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_soft_delete_contact(client, admin_headers, seed_company):
    """Deleting a contact soft-deletes it; it no longer appears in list."""
    create_resp = await client.post(
        "/api/v1/contacts",
        headers=admin_headers,
        json={
            "company_id": str(seed_company.id),
            "first_name": "Delete",
            "last_name": "Me",
        },
    )
    cid = create_resp.json()["data"]["id"]

    del_resp = await client.delete(f"/api/v1/contacts/{cid}", headers=admin_headers)
    assert del_resp.status_code == 204

    list_resp = await client.get("/api/v1/contacts", headers=admin_headers)
    ids = [c["id"] for c in list_resp.json()["data"]]
    assert cid not in ids


@pytest.mark.asyncio
async def test_update_contact(client, admin_headers, seed_company):
    """Updating a contact's title reflects in the response."""
    create_resp = await client.post(
        "/api/v1/contacts",
        headers=admin_headers,
        json={
            "company_id": str(seed_company.id),
            "first_name": "Update",
            "last_name": "Test",
        },
    )
    cid = create_resp.json()["data"]["id"]

    patch_resp = await client.patch(
        f"/api/v1/contacts/{cid}",
        headers=admin_headers,
        json={"title": "VP Engineering"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["title"] == "VP Engineering"

import pytest
import uuid


@pytest.mark.asyncio
async def test_create_deal(client, admin_headers, seed_company, seed_users):
    """Admin can create a deal; returns 201 with deal data wrapped in 'data'."""
    resp = await client.post(
        "/api/v1/deals",
        headers=admin_headers,
        json={"title": "Test Deal", "company_id": str(seed_company.id)},
    )
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["title"] == "Test Deal"
    assert data["stage"] == "Lead"


@pytest.mark.asyncio
async def test_list_deals_requires_auth(client, seed_users):
    """GET /deals without auth returns 401."""
    resp = await client.get("/api/v1/deals")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_list_deals_authenticated(client, admin_headers, seed_company, seed_users):
    """Authenticated user can list deals; response includes 'data' list and 'meta'."""
    resp = await client.get("/api/v1/deals", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "data" in body
    assert "meta" in body
    assert isinstance(body["data"], list)


@pytest.mark.asyncio
async def test_rep_sees_own_deals_only(client, rep_headers, manager_headers, seed_company, seed_users):
    """Rep should not see deals created by manager."""
    mgr_resp = await client.post(
        "/api/v1/deals",
        headers=manager_headers,
        json={"title": "Manager Deal Only", "company_id": str(seed_company.id)},
    )
    assert mgr_resp.status_code == 201

    resp = await client.get("/api/v1/deals", headers=rep_headers)
    assert resp.status_code == 200
    titles = [d["title"] for d in resp.json()["data"]]
    assert "Manager Deal Only" not in titles


@pytest.mark.asyncio
async def test_stage_transition(client, admin_headers, seed_company):
    """Admin can transition a deal's stage; new stage is reflected in response."""
    create_resp = await client.post(
        "/api/v1/deals",
        headers=admin_headers,
        json={"title": "Stage Test Deal", "company_id": str(seed_company.id)},
    )
    assert create_resp.status_code == 201
    deal_id = create_resp.json()["data"]["id"]

    stage_resp = await client.patch(
        f"/api/v1/deals/{deal_id}/stage",
        headers=admin_headers,
        json={"stage": "MQL"},
    )
    assert stage_resp.status_code == 200
    assert stage_resp.json()["data"]["stage"] == "MQL"


@pytest.mark.asyncio
async def test_invalid_stage_transition(client, admin_headers, seed_company):
    """Transitioning to an unknown stage returns 422."""
    create_resp = await client.post(
        "/api/v1/deals",
        headers=admin_headers,
        json={"title": "Invalid Stage Deal", "company_id": str(seed_company.id)},
    )
    deal_id = create_resp.json()["data"]["id"]

    resp = await client.patch(
        f"/api/v1/deals/{deal_id}/stage",
        headers=admin_headers,
        json={"stage": "NotAStage"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_delete_deal_rep_forbidden(client, rep_headers, admin_headers, seed_company):
    """Reps cannot delete deals; returns 403."""
    create_resp = await client.post(
        "/api/v1/deals",
        headers=admin_headers,
        json={"title": "Delete Test", "company_id": str(seed_company.id)},
    )
    deal_id = create_resp.json()["data"]["id"]

    resp = await client.delete(f"/api/v1/deals/{deal_id}", headers=rep_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_delete_deal_manager_allowed(client, manager_headers, seed_company):
    """Managers can soft-delete their own deals; returns 204 no content."""
    create_resp = await client.post(
        "/api/v1/deals",
        headers=manager_headers,
        json={"title": "Manager Delete Test", "company_id": str(seed_company.id)},
    )
    assert create_resp.status_code == 201
    deal_id = create_resp.json()["data"]["id"]

    resp = await client.delete(f"/api/v1/deals/{deal_id}", headers=manager_headers)
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_get_deal_not_found(client, admin_headers):
    """Fetching a non-existent deal returns 404."""
    fake_id = str(uuid.uuid4())
    resp = await client.get(f"/api/v1/deals/{fake_id}", headers=admin_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_deal_missing_company(client, admin_headers):
    """Creating a deal with an unknown company_id should fail (FK violation or 500)."""
    resp = await client.post(
        "/api/v1/deals",
        headers=admin_headers,
        json={"title": "Bad Deal", "company_id": str(uuid.uuid4())},
    )
    # FK constraint will cause an error; exact status depends on DB driver
    assert resp.status_code in (422, 500)


@pytest.mark.asyncio
async def test_stage_history_populated(client, admin_headers, seed_company):
    """After creating a deal, stage history should have the initial Lead entry."""
    create_resp = await client.post(
        "/api/v1/deals",
        headers=admin_headers,
        json={"title": "History Test Deal", "company_id": str(seed_company.id)},
    )
    deal_id = create_resp.json()["data"]["id"]

    hist_resp = await client.get(f"/api/v1/deals/{deal_id}/stage-history", headers=admin_headers)
    assert hist_resp.status_code == 200
    history = hist_resp.json()["data"]
    assert len(history) >= 1
    assert history[0]["to_stage"] == "Lead"
    assert history[0]["from_stage"] is None

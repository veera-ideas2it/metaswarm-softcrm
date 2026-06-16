import pytest


@pytest.mark.asyncio
async def test_dashboard_returns_all_fields(client, admin_headers, seed_company, seed_users):
    """Dashboard endpoint returns all expected top-level fields."""
    resp = await client.get("/api/v1/reports/dashboard", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "total_pipeline_value" in data
    assert "deals_won_this_month" in data
    assert "win_rate_percent" in data
    assert "avg_deal_size" in data
    assert "pipeline_by_stage" in data
    assert "deals_closing_soon" in data
    assert "recent_activities" in data


@pytest.mark.asyncio
async def test_dashboard_deals_won_shape(client, admin_headers, seed_company, seed_users):
    """deals_won_this_month is an object with count and value fields."""
    resp = await client.get("/api/v1/reports/dashboard", headers=admin_headers)
    assert resp.status_code == 200
    won = resp.json()["data"]["deals_won_this_month"]
    assert "count" in won
    assert "value" in won


@pytest.mark.asyncio
async def test_dashboard_requires_auth(client, seed_users):
    """Dashboard endpoint requires authentication; unauthenticated returns 401."""
    resp = await client.get("/api/v1/reports/dashboard")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_dashboard_rep_sees_own_data(client, rep_headers, seed_users):
    """Rep with no deals should see 0 total_pipeline_value."""
    resp = await client.get("/api/v1/reports/dashboard", headers=rep_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["total_pipeline_value"] == 0.0


@pytest.mark.asyncio
async def test_dashboard_pipeline_by_stage_list(client, admin_headers, seed_company, seed_users):
    """pipeline_by_stage is a list; each entry has stage, count, value."""
    resp = await client.get("/api/v1/reports/dashboard", headers=admin_headers)
    assert resp.status_code == 200
    stages = resp.json()["data"]["pipeline_by_stage"]
    assert isinstance(stages, list)
    for entry in stages:
        assert "stage" in entry
        assert "count" in entry
        assert "value" in entry


@pytest.mark.asyncio
async def test_dashboard_numeric_fields_non_negative(client, admin_headers, seed_company, seed_users):
    """Numeric dashboard metrics should be non-negative floats."""
    resp = await client.get("/api/v1/reports/dashboard", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["total_pipeline_value"] >= 0
    assert data["win_rate_percent"] >= 0
    assert data["avg_deal_size"] >= 0

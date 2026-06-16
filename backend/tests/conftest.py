import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models import User, Company, Contact, Deal, Activity, StageHistory  # ensure all models registered
from app.auth.password import hash_password

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def engine():
    eng = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def db(engine):
    """Provide a DB session that truncates all tables after each test for isolation."""
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        # Clean up all rows after each test so fixtures don't accumulate
        await session.rollback()
        async with engine.begin() as conn:
            for table in reversed(Base.metadata.sorted_tables):
                await conn.execute(table.delete())


@pytest_asyncio.fixture
async def client(engine):
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def seed_users(db):
    """Insert admin, manager, and rep users; committed so the client session can see them."""
    import uuid
    admin = User(
        id=uuid.uuid4(),
        email="admin@test.com",
        full_name="Admin User",
        hashed_password=hash_password("Admin1234!"),
        role="admin",
        is_active=True,
    )
    manager = User(
        id=uuid.uuid4(),
        email="manager@test.com",
        full_name="Manager User",
        hashed_password=hash_password("Manager1234!"),
        role="manager",
        is_active=True,
    )
    rep = User(
        id=uuid.uuid4(),
        email="rep@test.com",
        full_name="Rep User",
        hashed_password=hash_password("Rep1234!"),
        role="rep",
        is_active=True,
    )
    db.add_all([admin, manager, rep])
    await db.commit()
    return {"admin": admin, "manager": manager, "rep": rep}


async def get_token(client, email, password):
    """Login and return the access token. Login returns TokenResponse directly (no data wrapper)."""
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
    return resp.json()["access_token"]


@pytest_asyncio.fixture
async def admin_headers(client, seed_users):
    token = await get_token(client, "admin@test.com", "Admin1234!")
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def manager_headers(client, seed_users):
    token = await get_token(client, "manager@test.com", "Manager1234!")
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def rep_headers(client, seed_users):
    token = await get_token(client, "rep@test.com", "Rep1234!")
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def seed_company(db, seed_users):
    import uuid
    company = Company(id=uuid.uuid4(), name="Test Corp", created_by=seed_users["admin"].id)
    db.add(company)
    await db.commit()
    return company

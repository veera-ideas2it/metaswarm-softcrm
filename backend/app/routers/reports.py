
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.common import Response
from app.schemas.dashboard import DashboardData
from app.services.dashboard import get_dashboard_data

router = APIRouter(tags=["reports"])


@router.get("/dashboard", response_model=Response[DashboardData])
async def dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response[DashboardData]:
    data = await get_dashboard_data(user=current_user, db=db)
    return Response(data=data)

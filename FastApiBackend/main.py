
from Admin.api.routes import router as admin_router
app.include_router(admin_router, prefix='/admin/v1', tags=['admin'])
from Huesped.api.routes import router as huesped_router
app.include_router(huesped_router, prefix='/huesped/v1', tags=['huesped'])
from Auth.api.routes import router as auth_router
app.include_router(auth_router, prefix='/auth/v1', tags=['auth'])
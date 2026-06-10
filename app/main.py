from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, admin_routes, manager_routes, user_routes
from app.database import is_mock_db

app = FastAPI(
    title="User Authentication API",
    description="FastAPI with MongoDB, JWT Authentication, and RBAC",
    version="1.0.0"
)

# CORS Middleware config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
)

# Include the Routers
app.include_router(auth.router)
app.include_router(admin_routes.router)
app.include_router(manager_routes.router)
app.include_router(user_routes.router)

@app.get("/")
def read_root():
    db_status = "In-Memory (mongomock)" if is_mock_db else "Real MongoDB Server"
    return {
        "message": "Welcome to the FastAPI Authentication & RBAC Service",
        "database_status": db_status,
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

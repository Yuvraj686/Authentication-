from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth
from app.database import is_mock_db

app = FastAPI(
    title="User Authentication API",
    description="FastAPI with MongoDB (with fallback to mongomock) and JWT Authentication",
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

# Include the Authentication Router
app.include_router(auth.router)

@app.get("/")
def read_root():
    db_status = "In-Memory (mongomock)" if is_mock_db else "Real MongoDB Server"
    return {
        "message": "Welcome to the FastAPI Authentication Service",
        "database_status": db_status,
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

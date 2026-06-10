# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "user"

class UserOut(BaseModel):
    id: str
    username: str = "unknown"
    email: EmailStr
    role: str = "user"
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: Optional[str] = None
    role: Optional[str] = None

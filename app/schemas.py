from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = 'user'

class UserOut(BaseModel):
    id: str
    username: str = 'unknown'
    email: EmailStr
    role: str = 'user'
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: Optional[str] = None
    role: Optional[str] = None

class MessageCreate(BaseModel):
    receiver_id: str
    content: str

class MessageOut(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    content: str
    is_read: bool
    created_at: datetime

class GroupCreate(BaseModel):
    name: str
    member_ids: List[str] = []

class GroupOut(BaseModel):
    id: str
    name: str
    admin_id: str
    member_ids: List[str]
    created_at: datetime

class AddMemberRequest(BaseModel):
    user_id: str

class GroupMessageCreate(BaseModel):
    content: str

class GroupMessageOut(BaseModel):
    id: str
    group_id: str
    sender_id: str
    content: str
    created_at: datetime

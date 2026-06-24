from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from .. import schemas, utils, oauth2
from ..database import get_db

router = APIRouter(tags=['Authentication'])

@router.post('/register', status_code=status.HTTP_201_CREATED, response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db=Depends(get_db)):
    existing = db.users.find_one({"$or": [{"email": user_in.email}, {"username": user_in.username}]})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or username already registered")
    if user_in.role not in ["admin", "manager", "user"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin', 'manager', or 'user'.")
    hashed_pwd = utils.hash(user_in.password)
    user_dict = {
        "username": user_in.username,
        "email": user_in.email,
        "password": hashed_pwd,
        "role": user_in.role,
        "created_at": datetime.now(timezone.utc)
    }
    result = db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    return user_dict

@router.post('/login', response_model=schemas.Token)
def login(user_credentials: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    user = db.users.find_one({"email": user_credentials.username})
    if not user:
        user = db.users.find_one({"username": user_credentials.username})
        if not user:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Credentials")
    if not utils.verify(user_credentials.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Credentials")
    access_token = oauth2.create_access_token(data={"user_id": str(user["_id"]), "role": user.get("role", "user")})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get('/users/me', response_model=schemas.UserOut)
def get_me(current_user: dict = Depends(oauth2.get_current_user)):
    return current_user

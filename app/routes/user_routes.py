from fastapi import APIRouter, Depends
from pydantic import BaseModel
from .. import oauth2, database

router = APIRouter(prefix="/user", tags=["User"])

class ProfileUpdate(BaseModel):
    email: str
    username: str = None

@router.get("/profile")
def get_user_profile(current_user: dict = Depends(oauth2.require_user)):
    """Protected route. Only accessible by simple users."""
    return {
        "id": current_user.get("id"),
        "username": current_user.get("username"),
        "email": current_user.get("email"),
        "role": current_user.get("role"),
        "created_at": current_user.get("created_at")
    }

@router.put("/update-profile")
def update_user_profile(profile_data: ProfileUpdate, current_user: dict = Depends(oauth2.require_user), db = Depends(database.get_db)):
    """Protected route. Only accessible by simple users."""
    from bson import ObjectId
    update_data = {"email": profile_data.email}
    if profile_data.username:
        update_data["username"] = profile_data.username
        
    db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_data}
    )
    return {"message": "Profile updated successfully.", "updated_fields": update_data}

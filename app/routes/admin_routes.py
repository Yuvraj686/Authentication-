from fastapi import APIRouter, Depends
from .. import oauth2, database

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/dashboard")
def get_admin_dashboard(current_user: dict = Depends(oauth2.require_admin)):
    """Protected route. Only accessible by admins."""
    username = current_user.get("username", current_user.get("email"))
    return {"message": f"Welcome to the Admin Dashboard, {username}!"}

@router.delete("/delete-user/{user_id}")
def delete_user(user_id: str, current_user: dict = Depends(oauth2.require_admin), db = Depends(database.get_db)):
    """Protected route. Only accessible by admins."""
    from bson import ObjectId
    try:
        result = db.users.delete_one({"_id": ObjectId(user_id)})
        if result.deleted_count == 0:
            return {"message": "User not found"}
        return {"message": f"User {user_id} deleted successfully by admin."}
    except Exception:
        return {"message": "Invalid user ID"}

from fastapi import APIRouter, Depends
from .. import oauth2

router = APIRouter(prefix="/manager", tags=["Manager"])

@router.get("/reports")
def get_manager_reports(current_user: dict = Depends(oauth2.require_manager)):
    username = current_user.get("username", current_user.get("email"))
    return {"message": f"Manager {username} viewing reports."}

@router.post("/assign-task")
def assign_task(task_name: str, assignee: str, current_user: dict = Depends(oauth2.require_manager)):
    username = current_user.get("username", current_user.get("email"))
    return {
        "message": "Task assigned successfully.",
        "task": task_name,
        "assigned_to": assignee,
        "assigned_by": username
    }

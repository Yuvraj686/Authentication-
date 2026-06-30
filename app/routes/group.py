from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from bson import ObjectId
from .. import oauth2, database
from ..schemas import GroupCreate, GroupOut, AddMemberRequest, GroupMessageCreate, GroupMessageOut
from .websocket_manager import manager

router = APIRouter(prefix="/groups", tags=["Groups"])


def serialize_group(group: dict) -> dict:
    return {
        "id":         str(group["_id"]),
        "name":       group["name"],
        "admin_id":   str(group["admin_id"]),
        "member_ids": [str(m) for m in group["member_ids"]],
        "created_at": group["created_at"],
    }


def serialize_group_message(msg: dict) -> dict:
    return {
        "id":         str(msg["_id"]),
        "group_id":   str(msg["group_id"]),
        "sender_id":  str(msg["sender_id"]),
        "content":    msg["content"],
        "created_at": msg["created_at"],
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_group(payload: GroupCreate, current_user: dict = Depends(oauth2.get_current_user), db=Depends(database.get_db)):
    admin_obj_id = ObjectId(current_user["id"])
    member_obj_ids = [admin_obj_id]
    seen = {current_user["id"]}

    for uid in payload.member_ids:
        if uid in seen:
            continue
        try:
            obj_id = ObjectId(uid)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid member_id format: {uid}")
        if not db.users.find_one({"_id": obj_id}):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User {uid} not found.")
        member_obj_ids.append(obj_id)
        seen.add(uid)

    group_doc = {
        "name":       payload.name,
        "admin_id":   admin_obj_id,
        "member_ids": member_obj_ids,
        "created_at": datetime.now(timezone.utc),
    }
    result = db.groups.insert_one(group_doc)
    group_doc["_id"] = result.inserted_id
    return serialize_group(group_doc)


@router.get("/", response_model=list[GroupOut])
def list_my_groups(current_user: dict = Depends(oauth2.get_current_user), db=Depends(database.get_db)):
    groups = db.groups.find({"member_ids": ObjectId(current_user["id"])})
    return [serialize_group(g) for g in groups]


@router.get("/{group_id}", response_model=GroupOut)
def get_group(group_id: str, current_user: dict = Depends(oauth2.get_current_user), db=Depends(database.get_db)):
    try:
        group_obj_id = ObjectId(group_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid group_id format.")
    group = db.groups.find_one({"_id": group_obj_id})
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")
    if ObjectId(current_user["id"]) not in group["member_ids"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this group.")
    return serialize_group(group)


@router.post("/{group_id}/members", status_code=status.HTTP_200_OK)
def add_member(group_id: str, payload: AddMemberRequest, current_user: dict = Depends(oauth2.get_current_user), db=Depends(database.get_db)):
    try:
        group_obj_id  = ObjectId(group_id)
        new_member_id = ObjectId(payload.user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid id format.")
    group = db.groups.find_one({"_id": group_obj_id})
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")
    if str(group["admin_id"]) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the group admin can add members.")
    if not db.users.find_one({"_id": new_member_id}):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    db.groups.update_one({"_id": group_obj_id}, {"$addToSet": {"member_ids": new_member_id}})
    return serialize_group(db.groups.find_one({"_id": group_obj_id}))


@router.delete("/{group_id}/members/{user_id}", status_code=status.HTTP_200_OK)
def remove_member(group_id: str, user_id: str, current_user: dict = Depends(oauth2.get_current_user), db=Depends(database.get_db)):
    try:
        group_obj_id     = ObjectId(group_id)
        member_to_remove = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid id format.")
    group = db.groups.find_one({"_id": group_obj_id})
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")
    if str(group["admin_id"]) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the group admin can remove members.")
    if user_id == current_user["id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin cannot remove themselves from the group.")
    db.groups.update_one({"_id": group_obj_id}, {"$pull": {"member_ids": member_to_remove}})
    return {"message": f"User {user_id} removed from group."}


@router.delete("/{group_id}", status_code=status.HTTP_200_OK)
def delete_group(group_id: str, current_user: dict = Depends(oauth2.get_current_user), db=Depends(database.get_db)):
    try:
        group_obj_id = ObjectId(group_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid group_id format.")
    group = db.groups.find_one({"_id": group_obj_id})
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")
    if str(group["admin_id"]) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the group admin can delete the group.")
    db.groups.delete_one({"_id": group_obj_id})
    db.group_messages.delete_many({"group_id": group_obj_id})
    return {"message": "Group deleted successfully."}


@router.post("/{group_id}/messages", status_code=status.HTTP_201_CREATED)
async def send_group_message(group_id: str, payload: GroupMessageCreate, current_user: dict = Depends(oauth2.get_current_user), db=Depends(database.get_db)):
    try:
        group_obj_id = ObjectId(group_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid group_id format.")
    group = db.groups.find_one({"_id": group_obj_id})
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")
    if ObjectId(current_user["id"]) not in group["member_ids"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this group.")
    created_at = datetime.now(timezone.utc)
    message_doc = {
        "group_id":   group_obj_id,
        "sender_id":  current_user["id"],
        "content":    payload.content,
        "created_at": created_at,
    }
    result = db.group_messages.insert_one(message_doc)
    message_id = str(result.inserted_id)

    member_ids = [str(m) for m in group["member_ids"]]
    ws_payload = {
        "type":       "group_message",
        "id":         message_id,
        "group_id":   group_id,
        "sender_id":  current_user["id"],
        "content":    payload.content,
        "created_at": created_at.isoformat(),
    }
    await manager.send_to_group(member_ids, ws_payload)

    return {"message": "Message sent to group.", "message_id": message_id}


@router.get("/{group_id}/messages", response_model=list[GroupMessageOut])
def get_group_messages(group_id: str, current_user: dict = Depends(oauth2.get_current_user), db=Depends(database.get_db)):
    try:
        group_obj_id = ObjectId(group_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid group_id format.")
    group = db.groups.find_one({"_id": group_obj_id})
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")
    if ObjectId(current_user["id"]) not in group["member_ids"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this group.")
    messages = db.group_messages.find({"group_id": group_obj_id}).sort("created_at", 1)
    return [serialize_group_message(msg) for msg in messages]

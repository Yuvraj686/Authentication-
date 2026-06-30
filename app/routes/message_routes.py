from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from bson import ObjectId
from .. import oauth2, database
from ..schemas import MessageCreate, MessageOut
from .websocket_manager import manager

router = APIRouter(prefix="/messages", tags=["Messages"])


def serialize_message(msg):
    return {
        "id":          str(msg["_id"]),
        "sender_id":   str(msg["sender_id"]),
        "receiver_id": str(msg["receiver_id"]),
        "content":     msg["content"],
        "is_read":     msg.get("is_read", False),
        "created_at":  msg["created_at"],
    }


@router.post("/send", status_code=status.HTTP_201_CREATED)
async def send_message(
    payload: MessageCreate,
    current_user: dict = Depends(oauth2.get_current_user),
    db=Depends(database.get_db),
):
    if current_user["id"] == payload.receiver_id:
        raise HTTPException(status_code=400, detail="You cannot send a message to yourself.")
    try:
        receiver_obj_id = ObjectId(payload.receiver_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid receiver_id format.")
    if not db.users.find_one({"_id": receiver_obj_id}):
        raise HTTPException(status_code=404, detail="Receiver not found.")
    created_at = datetime.now(timezone.utc)
    doc = {
        "sender_id":   current_user["id"],
        "receiver_id": payload.receiver_id,
        "content":     payload.content,
        "is_read":     False,
        "created_at":  created_at,
    }
    result = db.messages.insert_one(doc)
    message_id = str(result.inserted_id)

    ws_payload = {
        "type":        "dm_message",
        "id":          message_id,
        "sender_id":   current_user["id"],
        "receiver_id": payload.receiver_id,
        "content":     payload.content,
        "is_read":     False,
        "created_at":  created_at.isoformat(),
    }
    await manager.send_to_user(current_user["id"], ws_payload)
    await manager.send_to_user(payload.receiver_id, ws_payload)

    return {"message": "Message sent successfully.", "message_id": message_id}


@router.get("/conversation/{user_id}", response_model=list[MessageOut])
def get_conversation(
    user_id: str,
    current_user: dict = Depends(oauth2.get_current_user),
    db=Depends(database.get_db),
):
    me = current_user["id"]
    msgs = db.messages.find(
        {"$or": [{"sender_id": me, "receiver_id": user_id},
                 {"sender_id": user_id, "receiver_id": me}]}
    ).sort("created_at", 1)
    return [serialize_message(m) for m in msgs]


@router.get("/inbox", response_model=list[MessageOut])
def get_inbox(
    current_user: dict = Depends(oauth2.get_current_user),
    db=Depends(database.get_db),
):
    msgs = db.messages.find({"receiver_id": current_user["id"]}).sort("created_at", -1)
    return [serialize_message(m) for m in msgs]


@router.get("/sent", response_model=list[MessageOut])
def get_sent(
    current_user: dict = Depends(oauth2.get_current_user),
    db=Depends(database.get_db),
):
    msgs = db.messages.find({"sender_id": current_user["id"]}).sort("created_at", -1)
    return [serialize_message(m) for m in msgs]


@router.put("/{message_id}/read", status_code=status.HTTP_200_OK)
def mark_as_read(
    message_id: str,
    current_user: dict = Depends(oauth2.get_current_user),
    db=Depends(database.get_db),
):
    try:
        obj_id = ObjectId(message_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid message_id format.")
    msg = db.messages.find_one({"_id": obj_id})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")
    if msg["receiver_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorised to mark this message as read.")
    db.messages.update_one({"_id": obj_id}, {"$set": {"is_read": True}})
    return {"message": "Message marked as read."}

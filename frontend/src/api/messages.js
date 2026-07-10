import { apiFetch } from "./client";

export const fetchMessages = (groupId) => apiFetch(`/groups/${groupId}/messages`);

export const sendGroupMessage = (groupId, content) =>
  apiFetch(`/groups/${groupId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

export const fetchDMMessages = (userId) => apiFetch(`/messages/conversation/${userId}`);

export const sendDM = (receiverId, content) =>
  apiFetch("/messages/send", {
    method: "POST",
    body: JSON.stringify({ receiver_id: receiverId, content }),
  });

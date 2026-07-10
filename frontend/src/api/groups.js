import { apiFetch } from "./client";

export const fetchGroups = () => apiFetch("/groups/");

export const createGroup = (name) =>
  apiFetch("/groups/", { method: "POST", body: JSON.stringify({ name, member_ids: [] }) });

export const addGroupMember = (groupId, userId) =>
  apiFetch(`/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });

export const removeGroupMember = (groupId, userId) =>
  apiFetch(`/groups/${groupId}/members/${userId}`, { method: "DELETE" });

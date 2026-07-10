import { apiFetch } from "./client";

export const fetchAllUsers = () => apiFetch("/user/all");

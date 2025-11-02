import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

export interface RegistrationDraft {
  id: string;
  email: string;
  data: any;
  step: number;
  isSubmitted: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export async function createRegistrationDraft(email: string, data: any = {}, step: number = 1): Promise<RegistrationDraft> {
  const res = await authFetch(API_ENDPOINTS.registrationDrafts, {
    method: "POST",
    body: JSON.stringify({ email, data, step })
  });
  return res.json();
}

export async function getRegistrationDraft(id: string): Promise<RegistrationDraft> {
  const res = await authFetch(API_ENDPOINTS.registrationDraftById(id));
  return res.json();
}

export async function getRegistrationDraftByEmail(email: string): Promise<RegistrationDraft | null> {
  const res = await authFetch(API_ENDPOINTS.registrationDraftByEmail(email));
  if (!res.ok) return null;
  const data = await res.json();
  // API returns an array of drafts, get the most recent one
  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }
  return null;
}

export async function saveRegistrationDraft(id: string, email: string, data: any, step: number): Promise<RegistrationDraft> {
  const res = await authFetch(API_ENDPOINTS.registrationDraftById(id), {
    method: "PUT",
    body: JSON.stringify({ email, data, step })
  });
  return res.json();
}

export async function submitRegistrationDraft(id: string): Promise<{ userId: string }> {
  const res = await authFetch(API_ENDPOINTS.registrationDraftSubmit(id), { method: "POST" });
  return res.json();
}



/**
 * API client for admin cohort project management.
 */

import { getAuthHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AdminCohort {
  id: string;
  name: string;
  program: string | null;
  status: string;
  active_participants: number;
}

export interface AdminCohortProject {
  id: string;
  cohort_id: string;
  name: string;
  title: string;
  body: string;
  image_url: string | null;
  created_at: string;
}

export type AdminCohortsResult =
  | { success: true; cohorts: AdminCohort[] }
  | { success: false; error: string };

export type AdminCohortProjectsResult =
  | { success: true; projects: AdminCohortProject[] }
  | { success: false; error: string };

export type UploadProjectImageResult =
  | { success: true; image_url: string }
  | { success: false; error: string };

export async function fetchAdminCohorts(): Promise<AdminCohortsResult> {
  try {
    const response = await fetch(`${API_URL}/donor/dashboard/cohorts`, {
      headers: { ...getAuthHeaders() },
    });
    if (response.status === 200) {
      const data = await response.json();
      const cohorts = (data as Record<string, unknown>[]).map((c) => ({
        id: String(c.id),
        name: String(c.name),
        program: (c.program as string | null) ?? null,
        status: String(c.status),
        active_participants: Number(c.active_participants ?? 0),
      }));
      return { success: true, cohorts };
    }
    const data = await response.json().catch(() => ({}));
    return { success: false, error: (data as Record<string, unknown>).detail as string ?? "Could not load cohorts." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

export async function fetchCohortProjects(cohortId: string): Promise<AdminCohortProjectsResult> {
  try {
    const response = await fetch(`${API_URL}/donor/dashboard/cohorts/${cohortId}/projects`, {
      headers: { ...getAuthHeaders() },
    });
    if (response.status === 200) {
      const data = await response.json();
      const projects = (data as Record<string, unknown>[]).map((p) => ({
        id: String(p.id),
        cohort_id: String(p.cohort_id ?? cohortId),
        name: String(p.name ?? ""),
        title: String(p.title ?? ""),
        body: String(p.body ?? ""),
        image_url: (p.image_url as string | null) ?? null,
        created_at: String(p.created_at ?? ""),
      }));
      return { success: true, projects };
    }
    return { success: false, error: "Could not load projects." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

export async function uploadProjectImage(
  cohortId: string,
  projectId: string,
  file: File
): Promise<UploadProjectImageResult> {
  try {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch(
      `${API_URL}/admin/cohorts/${cohortId}/projects/${projectId}/image`,
      {
        method: "POST",
        headers: { ...getAuthHeaders() },
        body: formData,
      }
    );
    if (response.ok) {
      const data = await response.json();
      return { success: true, image_url: data.image_url };
    }
    const data = await response.json().catch(() => ({}));
    return { success: false, error: (data as Record<string, unknown>).detail as string ?? "Upload failed." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}
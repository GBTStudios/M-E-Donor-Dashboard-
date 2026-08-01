import { getAuthHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Story {
  id: string;
  name: string;
  title: string;
  body: string;
  image_url: string | null;
  featured: boolean;
  created_at: string;
  updated_at?: string;
}

export interface StoriesResult {
  success: boolean;
  stories?: Story[];
  story?: Story;
  status?: 401 | 403 | 404 | 422 | "error";
  error?: string;
}

export async function fetchAdminStories(): Promise<StoriesResult> {
  try {
    const response = await fetch(`${API_URL}/admin/stories`, {
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      const stories = await response.json();
      return { success: true, stories };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to this page." };
    }

    return { success: false, status: "error", error: "Something went wrong loading the stories." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export interface StoryFormFields {
  name: string;
  title: string;
  body: string;
  featured: boolean;
  image?: File | null;
}

function buildStoryFormData(fields: Partial<StoryFormFields>): FormData {
  const formData = new FormData();

  if (fields.name !== undefined) formData.append("name", fields.name);
  if (fields.title !== undefined) formData.append("title", fields.title);
  if (fields.body !== undefined) formData.append("body", fields.body);
  if (fields.featured !== undefined) formData.append("featured", String(fields.featured));
  if (fields.image) formData.append("image", fields.image);

  return formData;
}

export async function createAdminStory(fields: StoryFormFields): Promise<StoriesResult> {
  try {
    const response = await fetch(`${API_URL}/admin/stories`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
      body: buildStoryFormData(fields),
    });

    if (response.status === 201) {
      const story = await response.json();
      return { success: true, story };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to do this." };
    }

    if (response.status === 422) {
      return { success: false, status: 422, error: "Please check the name, title, body, and image before submitting." };
    }

    return { success: false, status: "error", error: "Something went wrong creating the story." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export async function updateAdminStory(
  id: string,
  fields: Partial<StoryFormFields>
): Promise<StoriesResult> {
  try {
    const response = await fetch(`${API_URL}/admin/stories/${id}`, {
      method: "PUT",
      headers: { ...getAuthHeaders() },
      body: buildStoryFormData(fields),
    });

    if (response.status === 200) {
      const story = await response.json();
      return { success: true, story };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to do this." };
    }

    if (response.status === 404) {
      return { success: false, status: 404, error: "This story no longer exists." };
    }

    if (response.status === 422) {
      return { success: false, status: 422, error: "Please check the fields before submitting." };
    }

    return { success: false, status: "error", error: "Something went wrong updating the story." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export async function deleteAdminStory(id: string): Promise<StoriesResult> {
  try {
    const response = await fetch(`${API_URL}/admin/stories/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      return { success: true };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to do this." };
    }

    if (response.status === 404) {
      return { success: false, status: 404, error: "This story no longer exists." };
    }

    return { success: false, status: "error", error: "Something went wrong deleting the story." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

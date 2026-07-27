type LoginResult =
  | { success: true; user: { id: number; email: string; name: string } }
  | { success: false; error: string };

export async function loginUser(
  email: string,
  password: string,
  keepSignedIn: boolean
): Promise<LoginResult> {
  try {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, keepSignedIn }),
    });

    if (response.status === 200) {
      const data = await response.json();
      return { success: true, user: data.user };
    }

    if (response.status === 401) {
      const data = await response.json();
      return { success: false, error: data.error };
    }

    if (response.status === 422) {
      return { success: false, error: "Please check your email and password format." };
    }

    return { success: false, error: "Something went wrong. Please try again." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}
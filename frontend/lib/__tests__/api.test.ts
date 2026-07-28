import { signUp } from "../api";
import type { SignUpFormValues } from "../validation";

const validValues: SignUpFormValues = {
  name: "  Jane Doe  ",
  email: "  jane@whitfieldfoundation.org  ",
  password: "SecurePass1!",
  confirmPassword: "SecurePass1!",
};

function mockFetchOnce(response: { ok: boolean; json: () => Promise<unknown> }) {
  global.fetch = jest.fn().mockResolvedValueOnce(response) as jest.Mock;
}

describe("signUp", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("trims name and email before sending, but not password", async () => {
    mockFetchOnce({
      ok: true,
      json: async () => ({ success: true, userId: "abc123", email: "jane@whitfieldfoundation.org" }),
    });

    await signUp(validValues);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/signup",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Jane Doe",
          email: "jane@whitfieldfoundation.org",
          password: "SecurePass1!",
        }),
      })
    );
  });

  it("returns a success response shape on 2xx with valid body", async () => {
    mockFetchOnce({
      ok: true,
      json: async () => ({ success: true, userId: "abc123", email: "jane@whitfieldfoundation.org" }),
    });

    const result = await signUp(validValues);
    expect(result).toEqual({ success: true, userId: "abc123", email: "jane@whitfieldfoundation.org" });
  });

  it("returns a duplicate-email error response as data, not a thrown error", async () => {
    mockFetchOnce({
      ok: false,
      json: async () => ({
        success: false,
        message: "An account with this email already exists.",
        field: "email",
      }),
    });

    const result = await signUp(validValues);
    expect(result).toEqual({
      success: false,
      message: "An account with this email already exists.",
      field: "email",
    });
  });

  it("throws a friendly error when the network request itself fails", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new TypeError("Failed to fetch")) as jest.Mock;

    await expect(signUp(validValues)).rejects.toThrow(
      "Could not reach the server. Check your connection and try again."
    );
  });

  it("throws a friendly error when the response body is not valid JSON", async () => {
    mockFetchOnce({
      ok: true,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    });

    await expect(signUp(validValues)).rejects.toThrow(
      "The server returned an unexpected response. Please try again."
    );
  });

  it("throws a friendly error when the response JSON doesn't match the expected shape", async () => {
    mockFetchOnce({
      ok: true,
      json: async () => ({ unexpected: "shape" }),
    });

    await expect(signUp(validValues)).rejects.toThrow(
      "The server returned an unexpected response. Please try again."
    );
  });

  it("throws when status is non-2xx but body claims success (contract violation)", async () => {
    mockFetchOnce({
      ok: false,
      json: async () => ({ success: true, userId: "abc123", email: "jane@whitfieldfoundation.org" }),
    });

    await expect(signUp(validValues)).rejects.toThrow(
      "The server returned an unexpected response. Please try again."
    );
  });
});
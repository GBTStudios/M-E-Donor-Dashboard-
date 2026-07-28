import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignUpForm } from "../SignUpForm";
import * as api from "@/lib/api";

// Mock the API module so tests never make real network calls.
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  signUp: jest.fn(),
}));

const mockedSignUp = api.signUp as jest.MockedFunction<typeof api.signUp>;

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
  await user.type(screen.getByLabelText(/work email/i), "jane@whitfieldfoundation.org");
  await user.type(screen.getByLabelText("Password"), "SecurePass1!");
  await user.type(screen.getByLabelText("Confirm password"), "SecurePass1!");
}

describe("SignUpForm", () => {
  beforeEach(() => {
    mockedSignUp.mockReset();
  });

  it("renders all required fields and buttons", () => {
    render(<SignUpForm />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
  });

  it("disables the submit button until the form is fully valid", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    const submitButton = screen.getByRole("button", { name: /create account/i });
    expect(submitButton).toBeDisabled();

    await fillValidForm(user);

    expect(submitButton).toBeEnabled();
  });

  it("shows an error message when a field is left empty and blurred", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    const nameField = screen.getByLabelText(/full name/i);
    await user.click(nameField);
    await user.tab(); // blur without typing anything

    expect(await screen.findByText("Full name is required.")).toBeInTheDocument();
  });

  it("shows an error for an invalid email format", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    const emailField = screen.getByLabelText(/work email/i);
    await user.type(emailField, "not-an-email");
    await user.tab();

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
  });

  it("shows an error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.type(screen.getByLabelText("Password"), "SecurePass1!");
    await user.type(screen.getByLabelText("Confirm password"), "DifferentPass1!");
    await user.tab();

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
  });

  it("shows the password strength meter once the user starts typing a password", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    expect(screen.queryByTestId("password-strength-meter")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Password"), "Abcdefg1!");

    expect(screen.getByTestId("password-strength-meter")).toBeInTheDocument();
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("calls the signUp API with the correct payload on valid submit", async () => {
    mockedSignUp.mockResolvedValue({
      success: true,
      userId: "abc123",
      email: "jane@whitfieldfoundation.org",
    });
    const user = userEvent.setup();
    render(<SignUpForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockedSignUp).toHaveBeenCalledWith({
        name: "Jane Doe",
        email: "jane@whitfieldfoundation.org",
        password: "SecurePass1!",
      });
    });
  });

  it("shows a success state after a successful submission", async () => {
    mockedSignUp.mockResolvedValue({
      success: true,
      userId: "abc123",
      email: "jane@whitfieldfoundation.org",
    });
    const user = userEvent.setup();
    render(<SignUpForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Account created")).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === "We've sent a verification code to jane@whitfieldfoundation.org. Enter it next to activate your account.")
    ).toBeInTheDocument();
  });

  it("shows a top-level error banner when the backend rejects the request", async () => {
    mockedSignUp.mockResolvedValue({
      success: false,
      message: "An account with this email already exists.",
      field: "email",
    });
    const user = userEvent.setup();
    render(<SignUpForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText("An account with this email already exists.")
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("shows a generic error banner when the API call throws a NetworkError", async () => {
    const { NetworkError } = jest.requireActual("@/lib/api");
    mockedSignUp.mockRejectedValue(new NetworkError());
    const user = userEvent.setup();
    render(<SignUpForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText("We couldn't reach the server. Check your connection and try again.")
    ).toBeInTheDocument();
  });

  it("does not call the API if the form is submitted while invalid", async () => {
    render(<SignUpForm />);

    // Force a submit attempt via Enter key while fields are empty.
    // The button itself is disabled, so we simulate a form submit event
    // to confirm the submit handler's own guard also blocks the call.
    const form = screen.getByRole("button", { name: /create account/i }).closest("form")!;
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    await waitFor(() => {
      expect(mockedSignUp).not.toHaveBeenCalled();
    });
  });

  it("clears the previous form error banner on a new submit attempt", async () => {
    mockedSignUp
      .mockResolvedValueOnce({ success: false, message: "Email already exists." })
      .mockResolvedValueOnce({ success: true, userId: "abc123", email: "jane@whitfieldfoundation.org" });

    const user = userEvent.setup();
    render(<SignUpForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText("Email already exists.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.queryByText("Email already exists.")).not.toBeInTheDocument();
    });
  });
});

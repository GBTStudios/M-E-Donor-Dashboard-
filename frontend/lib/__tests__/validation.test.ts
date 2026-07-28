import {
  isValidEmail,
  getPasswordStrength,
  validateSignUpField,
  validateSignUpForm,
  isSignUpFormValid,
  MIN_PASSWORD_LENGTH,
  type SignUpFormValues,
} from "../validation";

describe("isValidEmail", () => {
  it("accepts a normal email address", () => {
    expect(isValidEmail("jane@whitfieldfoundation.org")).toBe(true);
  });

  it("accepts emails with subdomains and plus-addressing", () => {
    expect(isValidEmail("jane+donor@mail.whitfieldfoundation.org")).toBe(true);
  });

  it("trims surrounding whitespace before checking", () => {
    expect(isValidEmail("  jane@whitfieldfoundation.org  ")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("rejects a string with no @ symbol", () => {
    expect(isValidEmail("janewhitfieldfoundation.org")).toBe(false);
  });

  it("rejects a string with no domain", () => {
    expect(isValidEmail("jane@")).toBe(false);
  });

  it("rejects a string with no top-level domain", () => {
    expect(isValidEmail("jane@whitfieldfoundation")).toBe(false);
  });

  it("rejects a string containing spaces", () => {
    expect(isValidEmail("jane doe@whitfieldfoundation.org")).toBe(false);
  });
});

describe("getPasswordStrength", () => {
  it("scores an empty password as 0 / Too weak", () => {
    const result = getPasswordStrength("");
    expect(result.score).toBe(0);
    expect(result.label).toBe("Too weak");
  });

  it("scores a short, simple password as weak", () => {
    // Under MIN_PASSWORD_LENGTH, no digits, no symbols, no mixed case.
    const result = getPasswordStrength("abc");
    expect(result.score).toBe(0);
  });

  it("gives one point for meeting minimum length alone", () => {
    const allLower = "abcdefgh"; // 8 chars, lowercase only
    expect(allLower.length).toBe(MIN_PASSWORD_LENGTH);
    const result = getPasswordStrength(allLower);
    expect(result.score).toBe(1);
  });

  it("gives credit for length + digits", () => {
    const result = getPasswordStrength("abcdefg1");
    expect(result.score).toBe(2);
  });

  it("gives credit for length + digits + symbol", () => {
    const result = getPasswordStrength("abcdefg1!");
    expect(result.score).toBe(3);
  });

  it("scores a long password with digits, symbols, and mixed case as Strong", () => {
    const result = getPasswordStrength("Abcdefg1!");
    expect(result.score).toBe(4);
    expect(result.label).toBe("Strong");
  });

  it("never returns a score above 4 even for very complex passwords", () => {
    const result = getPasswordStrength("Aa1!Aa1!Aa1!Aa1!Aa1!");
    expect(result.score).toBeLessThanOrEqual(4);
  });

  it("returns a color for every score", () => {
    ["", "abcdefgh", "abcdefg1", "abcdefg1!", "Abcdefg1!"].forEach((pw) => {
      const result = getPasswordStrength(pw);
      expect(result.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});

describe("validateSignUpField", () => {
  const baseValues: SignUpFormValues = {
    name: "Jane Doe",
    email: "jane@whitfieldfoundation.org",
    password: "SecurePass1!",
    confirmPassword: "SecurePass1!",
  };

  describe("name", () => {
    it("passes for a non-empty name", () => {
      expect(validateSignUpField("name", baseValues)).toBeUndefined();
    });

    it("fails for an empty name", () => {
      expect(validateSignUpField("name", { ...baseValues, name: "" })).toBe(
        "Full name is required."
      );
    });

    it("fails for a name that is only whitespace", () => {
      expect(validateSignUpField("name", { ...baseValues, name: "   " })).toBe(
        "Full name is required."
      );
    });
  });

  describe("email", () => {
    it("passes for a valid email", () => {
      expect(validateSignUpField("email", baseValues)).toBeUndefined();
    });

    it("fails for an empty email", () => {
      expect(validateSignUpField("email", { ...baseValues, email: "" })).toBe(
        "Email is required."
      );
    });

    it("fails for a malformed email", () => {
      expect(validateSignUpField("email", { ...baseValues, email: "not-an-email" })).toBe(
        "Enter a valid email address."
      );
    });
  });

  describe("password", () => {
    it("passes for a password meeting the minimum length", () => {
      expect(validateSignUpField("password", baseValues)).toBeUndefined();
    });

    it("fails for an empty password", () => {
      expect(validateSignUpField("password", { ...baseValues, password: "" })).toBe(
        "Password is required."
      );
    });

    it("fails for a password under the minimum length", () => {
      const short = "a".repeat(MIN_PASSWORD_LENGTH - 1);
      expect(validateSignUpField("password", { ...baseValues, password: short })).toBe(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      );
    });

    it("passes for a password exactly at the minimum length", () => {
      const exact = "a".repeat(MIN_PASSWORD_LENGTH);
      expect(
        validateSignUpField("password", { ...baseValues, password: exact })
      ).toBeUndefined();
    });
  });

  describe("confirmPassword", () => {
    it("passes when it matches password", () => {
      expect(validateSignUpField("confirmPassword", baseValues)).toBeUndefined();
    });

    it("fails when empty", () => {
      expect(
        validateSignUpField("confirmPassword", { ...baseValues, confirmPassword: "" })
      ).toBe("Please confirm your password.");
    });

    it("fails when it does not match password", () => {
      expect(
        validateSignUpField("confirmPassword", {
          ...baseValues,
          confirmPassword: "SomethingElse1!",
        })
      ).toBe("Passwords do not match.");
    });

    it("fails when password is later changed and confirmPassword is now stale", () => {
      // Simulates a user editing the password field after already typing
      // a matching confirmation — the field-level check should catch it
      // when re-run against the updated values.
      const changed = { ...baseValues, password: "NewPassword1!" };
      expect(validateSignUpField("confirmPassword", changed)).toBe(
        "Passwords do not match."
      );
    });
  });
});

describe("validateSignUpForm", () => {
  const validValues: SignUpFormValues = {
    name: "Jane Doe",
    email: "jane@whitfieldfoundation.org",
    password: "SecurePass1!",
    confirmPassword: "SecurePass1!",
  };

  it("returns an empty object for a fully valid form", () => {
    expect(validateSignUpForm(validValues)).toEqual({});
  });

  it("returns an error for every invalid field, and only those fields", () => {
    const invalidValues: SignUpFormValues = {
      name: "",
      email: "not-an-email",
      password: "short",
      confirmPassword: "different",
    };
    const errors = validateSignUpForm(invalidValues);

    expect(Object.keys(errors).sort()).toEqual(
      ["confirmPassword", "email", "name", "password"].sort()
    );
    expect(errors.name).toBe("Full name is required.");
    expect(errors.email).toBe("Enter a valid email address.");
  });

  it("does not include valid fields in the errors object", () => {
    const partiallyValid: SignUpFormValues = {
      ...validValues,
      email: "not-an-email",
    };
    const errors = validateSignUpForm(partiallyValid);
    expect(errors).toEqual({ email: "Enter a valid email address." });
  });
});

describe("isSignUpFormValid", () => {
  it("returns true for an empty errors object", () => {
    expect(isSignUpFormValid({})).toBe(true);
  });

  it("returns false when any error is present", () => {
    expect(isSignUpFormValid({ email: "Enter a valid email address." })).toBe(false);
  });
});
import { render, screen } from "@testing-library/react";
import { PasswordStrengthMeter } from "../../ui/PasswordStrengthMeter";

describe("PasswordStrengthMeter", () => {
  it("renders nothing when password is empty", () => {
    const { container } = render(<PasswordStrengthMeter password="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows 'Too weak' for a very simple password", () => {
    render(<PasswordStrengthMeter password="abc" />);
    expect(screen.getByText("Too weak")).toBeInTheDocument();
  });

  it("shows 'Strong' for a long password with digits, symbols, and mixed case", () => {
    render(<PasswordStrengthMeter password="Abcdefg1!" />);
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("updates the label as the password changes across rerenders", () => {
    const { rerender } = render(<PasswordStrengthMeter password="abcdefgh" />);
    expect(screen.getByText("Weak")).toBeInTheDocument();

    rerender(<PasswordStrengthMeter password="Abcdefg1!" />);
    expect(screen.getByText("Strong")).toBeInTheDocument();
    expect(screen.queryByText("Weak")).not.toBeInTheDocument();
  });
});

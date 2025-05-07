import { type Page, type Locator } from "@playwright/test";

export class RegisterPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly signupButton: Locator;
  readonly mailErrorText: Locator;
  readonly passwordErrorText: Locator;
  readonly confirmPasswordErrorText: Locator;
  readonly serverErrorMessage: Locator;
  readonly registrationSuccessMessage: Locator;
  readonly registrationSuccessMessageHeader: Locator;
  readonly registrationSuccessMessageText: Locator;
  readonly loginLinkAfterSignup: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId("email-input");
    this.passwordInput = page.getByTestId("password-input");
    this.confirmPasswordInput = page.getByTestId("confirm-password-input");
    this.signupButton = page.getByTestId("signup-button");
    this.mailErrorText = page.getByText("Nieprawidłowy adres email");
    this.passwordErrorText = page.getByText("Hasło musi mieć co najmniej 8 znaków");
    this.confirmPasswordErrorText = page.getByText("Potwierdzenie hasła jest wymagane");
    this.serverErrorMessage = page.getByTestId("server-error-message");
    this.registrationSuccessMessage = page.getByTestId("registration-success-message");
    this.registrationSuccessMessageHeader = page.getByText("Rejestracja zakończona pomyślnie");
    this.registrationSuccessMessageText = page.getByText("Na Twój adres email został");
    this.loginLinkAfterSignup = page.getByTestId("login-link-after-signup");
    this.loginLink = page.getByTestId("login-link");
  }

  async goto() {
    await this.page.goto("/auth/register", { waitUntil: "networkidle" });
  }

  async signup(email: string, password: string, confirmPassword: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.signupButton.click();
  }
}

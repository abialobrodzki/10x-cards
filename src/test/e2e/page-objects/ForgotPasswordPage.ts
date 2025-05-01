import { type Page, type Locator } from "@playwright/test";

export class ForgotPasswordPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly sendResetLinkButton: Locator;
  readonly serverErrorMessage: Locator;
  readonly resetLinkSentMessage: Locator;
  readonly backToLoginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId("email-input");
    this.sendResetLinkButton = page.getByTestId("send-reset-link-button");
    this.serverErrorMessage = page.getByTestId("server-error-message");
    this.resetLinkSentMessage = page.getByTestId("reset-link-sent-message");
    this.backToLoginLink = page.getByTestId("back-to-login-link");
  }

  async goto() {
    await this.page.goto("/auth/forgot-password");
  }

  async requestPasswordReset(email: string) {
    await this.emailInput.fill(email);
    await this.sendResetLinkButton.click();
  }
}

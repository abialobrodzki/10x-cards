import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SignUpForm } from "../../../components/auth/SignUpForm";
import userEvent from "@testing-library/user-event";

// Mockujemy fetch
const originalFetch = global.fetch;

describe("SignUpForm Extended Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Mockujemy windowLocation
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        href: "",
        assign: vi.fn(),
      },
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // Test obsługi różnych błędów API
  describe("API Error Handling", () => {
    it("shows error message when email is already taken", async () => {
      // Mockujemy fetch, aby zwrócił błąd "email already exists"
      global.fetch = vi.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 409,
          redirected: false,
          json: () => Promise.resolve({ error: "Email jest już zajęty" }),
        })
      );

      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/potwierdź hasło/i);
      const submitButton = screen.getByRole("button", { name: /zarejestruj/i });

      // Wprowadzamy dane
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });

      // Próbujemy zarejestrować się
      fireEvent.click(submitButton);

      // Zwiększony timeout dla oczekiwania na błąd
      await waitFor(
        () => {
          expect(screen.getByText(/email jest już zajęty/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it("shows generic error message on network error", async () => {
      // Mockujemy fetch, aby zwrócił błąd sieci
      global.fetch = vi.fn().mockImplementationOnce(() => Promise.reject(new Error("Network Error")));

      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/potwierdź hasło/i);
      const submitButton = screen.getByRole("button", { name: /zarejestruj/i });

      // Wprowadzamy dane
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });

      // Próbujemy zarejestrować się
      fireEvent.click(submitButton);

      // Zwiększony timeout dla oczekiwania na błąd
      await waitFor(
        () => {
          expect(screen.getByText(/nie można połączyć się z serwerem/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it("handles server error with specific message", async () => {
      // Mockujemy fetch, aby zwrócił niestandardowy błąd serwera
      global.fetch = vi.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          redirected: false,
          json: () => Promise.resolve({ error: "Błąd serwera. Spróbuj ponownie później." }),
        })
      );

      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/potwierdź hasło/i);
      const submitButton = screen.getByRole("button", { name: /zarejestruj/i });

      // Wprowadzamy dane
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });

      // Próbujemy zarejestrować się
      fireEvent.click(submitButton);

      // Zwiększony timeout dla oczekiwania na błąd
      await waitFor(
        () => {
          expect(screen.getByText(/błąd serwera\. spróbuj ponownie później\./i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  // Test zapobiegający wielokrotnemu wysłaniu formularza
  describe("Form Submission Protection", () => {
    it("disables submit button during registration process", async () => {
      // Mockujemy fetch, aby symulować długotrwałą rejestrację
      global.fetch = vi.fn().mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  redirected: false,
                  json: () => Promise.resolve({ success: true }),
                }),
              2000
            );
          })
      );

      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/potwierdź hasło/i);
      const submitButton = screen.getByRole("button", { name: /zarejestruj/i });

      // Wprowadzamy dane
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });

      // Sprawdzamy, że początkowo przycisk nie jest wyłączony
      expect(submitButton).not.toBeDisabled();

      // Próbujemy zarejestrować się
      fireEvent.click(submitButton);

      // Zwiększony timeout dla oczekiwania na zmianę stanu przycisku
      await waitFor(
        () => {
          // Sprawdzamy, czy przyciski formularza są wyłączone podczas rejestracji
          expect(submitButton).toBeDisabled();
          expect(emailInput).toBeDisabled();
          expect(passwordInput).toBeDisabled();
          expect(confirmPasswordInput).toBeDisabled();
        },
        { timeout: 3000 }
      );

      // Sprawdzamy, czy tekst przycisku zmienił się na "Rejestracja..."
      await waitFor(
        () => {
          expect(submitButton).toHaveTextContent("Rejestracja...");
        },
        { timeout: 3000 }
      );
    });

    it("prevents multiple form submissions on double-click", async () => {
      // Mockujemy fetch, aby symulować rejestrację
      global.fetch = vi.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          redirected: false,
          json: () => Promise.resolve({ success: true }),
        })
      );

      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/potwierdź hasło/i);
      const submitButton = screen.getByRole("button", { name: /zarejestruj/i });

      // Wprowadzamy dane
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });

      // Klikamy dwa razy szybko po sobie
      await userEvent.dblClick(submitButton);

      // Zwiększony timeout dla oczekiwania na wywołanie fetch
      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 }
      );
    });
  });

  // Test obsługi przekierowania
  describe("Redirect Handling", () => {
    it("redirects to the URL from response when registration success with redirect", async () => {
      // Mockujemy fetch, aby zwrócił przekierowanie
      global.fetch = vi.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          redirected: true,
          url: "/dashboard",
          json: () => Promise.resolve({}), // Dodajemy metodę json aby uniknąć błędów
        })
      );

      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/potwierdź hasło/i);
      const submitButton = screen.getByRole("button", { name: /zarejestruj/i });

      // Wprowadzamy dane
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });

      // Próbujemy zarejestrować się
      fireEvent.click(submitButton);

      // Zwiększony timeout dla oczekiwania na przekierowanie
      await waitFor(
        () => {
          expect(window.location.assign).toHaveBeenCalledWith("/dashboard");
        },
        { timeout: 5000 }
      );
    });
  });
});

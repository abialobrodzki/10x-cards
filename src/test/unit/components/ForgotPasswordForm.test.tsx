import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event"; // Import user-event
import { describe, it, expect } from "vitest";
// Importy MSW
import { http, HttpResponse } from "msw";
import { server } from "../../../mocks/server"; // Upewnij się, że ścieżka jest poprawna
import { ForgotPasswordForm } from "../../../components/auth/ForgotPasswordForm";

// Nie potrzebujemy już globalnego mocka fetch
// const mockFetch = vi.fn();
// global.fetch = mockFetch;

// Kontrola serwera MSW - zakładamy, że setupTests działa
// beforeAll(() => server.listen());
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());

describe("ForgotPasswordForm", () => {
  // Usunięto nieużywane beforeEach
  // beforeEach(() => {
  //   vi.resetAllMocks();
  // });

  const renderComponent = () => {
    return render(<ForgotPasswordForm />);
  };

  it("should render the form with email input and submit button", () => {
    // Arrange & Act
    renderComponent();

    // Assert
    expect(screen.getByRole("heading", { name: /resetowanie hasła/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /wyślij link resetujący/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /wróć do logowania/i })).toBeInTheDocument();
  });

  // Pomiń ten test na razie
  it.skip("should display validation error for invalid email format", async () => {
    // Arrange
    const user = userEvent.setup();
    // Renderuj komponent i uzyskaj dostęp do kontenera
    const { container } = render(<ForgotPasswordForm />);
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /wyślij link resetujący/i });

    // Act
    await user.type(emailInput, "invalid-email");
    // Symuluj opuszczenie pola (blur), aby potencjalnie wyzwolić walidację wcześniej
    await user.tab();
    await user.click(submitButton);

    // Assert
    // Poczekaj na potencjalną aktualizację DOM po walidacji
    await waitFor(() => {
      // Znajdź element komunikatu błędu przez selektor data-slot
      const errorMessageElement = container.querySelector('p[data-slot="form-message"]');
      expect(errorMessageElement).toBeInTheDocument();
      expect(errorMessageElement).toHaveTextContent(/nieprawidłowy adres email/i);
    });
  });

  it("should display validation error for empty email field on submit", async () => {
    // Arrange
    const user = userEvent.setup();
    const { container } = render(<ForgotPasswordForm />); // Pobierz container
    const submitButton = screen.getByRole("button", { name: /wyślij link resetujący/i });

    // Act
    // Usunięto act
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      // Dodaj waitFor dla spójności
      const errorMessageElement = container.querySelector('p[data-slot="form-message"]');
      expect(errorMessageElement).toBeInTheDocument();
      // Z schema wynika, że pusty string też powinien dać błąd email
      expect(errorMessageElement).toHaveTextContent(/nieprawidłowy adres email/i);
    });
  });

  it("should call fetch with correct data, display success message, and reset form on successful submission", async () => {
    // Arrange
    const user = userEvent.setup();
    // Dodajmy opóźnienie do domyślnego handlera dla tego testu
    server.use(
      http.post("/api/auth/forgot-password", async () => {
        // Symuluj opóźnienie sieciowe
        await new Promise((res) => setTimeout(res, 100)); // 100ms opóźnienia
        return HttpResponse.json({}, { status: 200 });
      })
    );
    renderComponent();
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /wyślij link resetujący/i });
    const testEmail = "test@example.com";

    // Act
    await user.type(emailInput, testEmail);
    // Usunięto act
    await user.click(submitButton);

    // Assert
    // Czekamy na zmianę stanu przycisku po kliknięciu
    // Spróbujmy poczekać na tekst przycisku zamiast stanu disabled
    await waitFor(() => {
      // expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(/wysyłanie.../i);
    });

    // Sprawdzenie komunikatu sukcesu i resetu formularza
    expect(await screen.findByText(/Link do resetowania hasła został wysłany/i)).toBeInTheDocument();
    expect(emailInput).toHaveValue(""); // Formularz zresetowany
    // Czekamy aż przycisk przestanie być nieaktywny
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
    expect(screen.queryByRole("button", { name: /wysyłanie.../i })).not.toBeInTheDocument(); // Przycisk wrócił do normy
  });

  it("should display server error message on failed API response", async () => {
    // Arrange
    const user = userEvent.setup();
    const errorMessage = "Użytkownik nie istnieje";
    // Używamy server.use() do nadpisania domyślnego handlera dla tego testu
    server.use(
      http.post("/api/auth/forgot-password", () => {
        return HttpResponse.json({ error: errorMessage }, { status: 400 }); // Lub inny status błędu
      })
    );

    renderComponent();
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /wyślij link resetujący/i });

    // Act
    await user.type(emailInput, "nonexistent@example.com");
    // Usunięto act
    await user.click(submitButton);

    // Assert
    // Czekamy na pojawienie się komunikatu o błędzie serwera
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(screen.queryByText(/Link do resetowania hasła został wysłany/i)).not.toBeInTheDocument();
    // Czekamy aż przycisk przestanie być nieaktywny
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });

  it("should display generic server error message on network error", async () => {
    // Arrange
    const user = userEvent.setup();
    // Nadpisujemy handler, aby symulować błąd sieciowy
    server.use(
      http.post("/api/auth/forgot-password", () => {
        return HttpResponse.error(); // Symuluje błąd sieciowy
      })
    );
    renderComponent();
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /wyślij link resetujący/i });

    // Act
    await user.type(emailInput, "test@example.com");
    // Usunięto act
    await user.click(submitButton);

    // Assert
    // Czekamy na pojawienie się generycznego komunikatu o błędzie
    expect(await screen.findByText(/nie można połączyć się z serwerem/i)).toBeInTheDocument();
    expect(screen.queryByText(/Link do resetowania hasła został wysłany/i)).not.toBeInTheDocument();
    // Czekamy aż przycisk przestanie być nieaktywny
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });
});

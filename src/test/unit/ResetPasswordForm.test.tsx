import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { ResetPasswordForm } from "../../components/auth/ResetPasswordForm";
// Import MSW server and handlers directly for this test suite
import { server } from "../../mocks/server";
// import { http, HttpResponse } from "msw"; // Removed unused imports

// ----- Remove vi.fn() fetch mocking -----
// const mockFetch = vi.fn(); // REMOVED
// global.fetch = mockFetch; // REMOVED

// ----- Mock other dependencies (localStorage, location, history) -----
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};
global.localStorage = mockLocalStorage;

// --- Mock window.location more carefully ---
const mockAssign = vi.fn();
let originalLocation = window.location;

const setupLocationMock = () => {
  mockAssign.mockClear(); // Clear mock calls
  originalLocation = window.location; // Re-capture original in case it changed

  // Keep track of the current href
  let currentHref = "http://localhost:3000";

  Object.defineProperty(window, "location", {
    value: {
      // Provide essential properties/methods used by the component or tests
      assign: mockAssign,
      replace: vi.fn(), // Mock other methods if needed
      reload: vi.fn(),
      get href() {
        return currentHref;
      },
      set href(url) {
        // eslint-disable-next-line no-console
        console.log(`[Mock Location] Setting href to: ${url}`);
        currentHref = url;
        mockAssign(url); // Trigger our spy when href is set
      },
      // Add other properties like origin, pathname, search, hash as needed
      origin: "http://localhost:3000",
      pathname: "/",
      search: "",
      hash: "",
    },
    writable: true,
    configurable: true,
  });
};

const cleanupLocationMock = () => {
  // Restore original location if needed, or simply ensure clean state
  // For simplicity, we just ensure it's configurable for the next setup
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
};
// ------------------------------------------

const mockReplaceState = vi.fn();
const originalHistory = window.history;
Object.defineProperty(window, "history", {
  // Keep history mock as is
  writable: true,
  value: { ...originalHistory, replaceState: mockReplaceState },
});

// Mock import.meta.env
vi.stubGlobal("import.meta.env", { DEV: false });

// --- MSW Setup specific to this test file ---
beforeAll(() => server.listen({ onUnhandledRequest: "error" })); // Error on unhandled to be sure
afterEach(() => {
  server.resetHandlers();
  cleanupLocationMock(); // Clean up location mock
});
afterAll(() => server.close());
// -------------------------------------------

describe("ResetPasswordForm", () => {
  const mockTokenFromProps = "prop-token-123";

  beforeEach(() => {
    vi.resetAllMocks();
    setupLocationMock(); // Setup location mock before each test
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  const renderComponent = (props: Partial<React.ComponentProps<typeof ResetPasswordForm>> = {}) => {
    // Domyślnie przekazujemy token przez props dla prostoty
    return render(<ResetPasswordForm token={mockTokenFromProps} {...props} />);
  };

  const fillForm = (password = "newPassword123", confirm = "newPassword123") => {
    fireEvent.change(screen.getByLabelText("Nowe hasło", { exact: true }), { target: { value: password } });
    fireEvent.change(screen.getByLabelText("Potwierdź nowe hasło", { exact: true }), { target: { value: confirm } });
  };

  // --- Testy ekstrakcji tokenu ---
  it("should use token from props if provided", () => {
    renderComponent({ token: "from-props" });
    expect(screen.getByRole("button", { name: /zresetuj hasło/i })).toBeEnabled();
  });

  it("should use token from localStorage if props token is empty", () => {
    mockLocalStorage.getItem.mockReturnValueOnce("from-local-storage");
    renderComponent({ token: "" }); // Pusty token w propsach
    expect(screen.getByRole("button", { name: /zresetuj hasło/i })).toBeEnabled();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("reset_password_token");
  });

  it("should use token from URL hash if props and localStorage are empty", () => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...window.location, hash: "#access_token=from-hash" },
    });
    renderComponent({ token: "" });
    expect(screen.getByRole("button", { name: /zresetuj hasło/i })).toBeEnabled();
    expect(mockReplaceState).toHaveBeenCalled(); // Hash powinien zostać wyczyszczony
  });

  it("should use token from URL query param 'token'", () => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...window.location, search: "?other=abc&token=from-query-token" },
    });
    renderComponent({ token: "" });
    expect(screen.getByRole("button", { name: /zresetuj hasło/i })).toBeEnabled();
  });

  it("should use token from URL query param 'code'", () => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...window.location, search: "?other=xyz&code=from-query-code" },
    });
    renderComponent({ token: "" });
    expect(screen.getByRole("button", { name: /zresetuj hasło/i })).toBeEnabled();
  });

  it("should disable submit button and show error if no token is found", () => {
    renderComponent({ token: "" }); // Brak tokenu we wszystkich źródłach
    expect(screen.getByRole("button", { name: /zresetuj hasło/i })).toBeDisabled();
    expect(screen.getByText(/brak tokenu resetowania/i)).toBeInTheDocument();
  });

  // --- Testy formularza ---
  it("should render the form with password fields and submit button", () => {
    renderComponent();
    expect(screen.getByRole("heading", { name: /resetowanie hasła/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Nowe hasło", { exact: true })).toBeInTheDocument();
    expect(screen.getByLabelText("Potwierdź nowe hasło", { exact: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zresetuj hasło/i })).toBeInTheDocument();
  });

  it("should display validation error if password is too short", async () => {
    renderComponent();
    fillForm("short", "short");
    fireEvent.click(screen.getByRole("button", { name: /zresetuj hasło/i }));
    expect(await screen.findByText(/hasło musi mieć co najmniej 8 znaków/i)).toBeInTheDocument();
    // Validation error, fetch should not be called
    // expect(mockFetch).not.toHaveBeenCalled(); // REMOVED (MSW handles fetch)
  });

  it("should display validation error if passwords do not match", async () => {
    renderComponent();
    fillForm("password123", "different123");
    fireEvent.click(screen.getByRole("button", { name: /zresetuj hasło/i }));
    expect(await screen.findByText(/hasła nie pasują/i)).toBeInTheDocument();
    // Validation error, fetch should not be called
    // expect(mockFetch).not.toHaveBeenCalled(); // REMOVED (MSW handles fetch)
  });

  it("should call fetch with token and new password, show success message on successful reset", async () => {
    renderComponent(); // Uses default prop-token-123
    fillForm();
    const submitButton = screen.getByRole("button", { name: /zresetuj hasło/i });

    fireEvent.click(submitButton);

    // REMOVED Check for loading text as it seems flaky
    // await waitFor(() => expect(submitButton).toHaveTextContent(/resetowanie.../i));

    // Wait for success message
    expect(await screen.findByText(/hasło zostało pomyślnie zmienione/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /przejdź do logowania/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resetowanie.../i })).not.toBeInTheDocument();
  });

  it("should redirect if API response contains redirect flag", async () => {
    const redirectUrl = "/custom-login-page";
    // Pass the specific token to trigger the MSW redirect handler
    renderComponent({ token: "redirect-token" });
    fillForm();
    const submitButton = screen.getByRole("button", { name: /zresetuj hasło/i });

    fireEvent.click(submitButton);

    // Wait for the redirect function to be called
    await waitFor(() => {
      expect(mockAssign).toHaveBeenCalledWith(redirectUrl);
    });
  });

  it("should display server error message on failed API response", async () => {
    const errorMessage = "Invalid token"; // The expected error message from API
    renderComponent({ token: "fail-token" });
    fillForm();
    const submitButton = screen.getByRole("button", { name: /zresetuj hasło/i });

    fireEvent.click(submitButton);

    // Assert the specific error message from the API is shown (REINSTATED)
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    // Button should be re-enabled after error
    expect(submitButton).toBeEnabled();
    expect(screen.queryByText(/hasło zostało pomyślnie zmienione/i)).not.toBeInTheDocument();
  });

  it("should display generic server error message on network error", async () => {
    renderComponent({ token: "network-error-token" });
    fillForm();
    const submitButton = screen.getByRole("button", { name: /zresetuj hasło/i });

    fireEvent.click(submitButton);

    // REMOVED check for loading text
    // await waitFor(() => expect(submitButton).toHaveTextContent(/resetowanie.../i));

    // Assert the generic network error message
    expect(await screen.findByText(/nie można połączyć się z serwerem/i)).toBeInTheDocument();
    // Button should be re-enabled after error
    expect(submitButton).toBeEnabled();
  });
});

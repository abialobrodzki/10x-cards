import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SignUpForm } from "../../../components/auth/SignUpForm";

// ----- Mockowanie zależności -----
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper functions for creating mock responses
const createSuccessResponse = (data = { success: true, requiresEmailConfirmation: false }) => {
  return {
    ok: true,
    status: 200,
    redirected: false,
    url: "",
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(""),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    headers: new Headers(),
    statusText: "OK",
    type: "basic",
    clone: function () {
      return this;
    },
    body: null,
    bodyUsed: false,
  };
};

const createErrorResponse = (status = 400, errorMessage = "Error") => {
  return {
    ok: false,
    status,
    redirected: false,
    url: "",
    json: () => Promise.resolve({ error: errorMessage }),
    text: () => Promise.resolve(""),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    headers: new Headers(),
    statusText: "Error",
    type: "basic",
    clone: function () {
      return this;
    },
    body: null,
    bodyUsed: false,
  };
};

const createRedirectResponse = (redirectUrl = "/dashboard") => {
  return {
    ok: false,
    status: 302,
    redirected: true,
    url: redirectUrl,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    headers: new Headers(),
    statusText: "Found",
    type: "basic",
    clone: function () {
      return this;
    },
    body: null,
    bodyUsed: false,
  };
};

// Mock window.location
const mockAssign = vi.fn();
const originalLocation = window.location;

beforeEach(() => {
  // Reset mocks before each test
  vi.resetAllMocks();
  mockAssign.mockClear();

  // Mock window.location
  let hrefValue = "";
  Object.defineProperty(window, "location", {
    writable: true,
    value: {
      ...originalLocation,
      assign: mockAssign,
      get href() {
        return hrefValue;
      },
      set href(val) {
        hrefValue = val;
        mockAssign(val);
      },
    },
  });

  // Default success response
  mockFetch.mockResolvedValue(createSuccessResponse());
});

afterEach(() => {
  // Clean up
  vi.restoreAllMocks();
});

// ----- Koniec Mockowania -----

describe("SignUpForm", () => {
  const renderComponent = () => {
    return render(<SignUpForm />);
  };

  const fillForm = (password = "password123", confirm = "password123") => {
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/^hasło$/i), { target: { value: password } });
    fireEvent.change(screen.getByLabelText(/potwierdź hasło/i), { target: { value: confirm } });
  };

  it("should render the sign-up form correctly", () => {
    renderComponent();
    expect(screen.getByRole("heading", { name: /rejestracja/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^hasło$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/potwierdź hasło/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zarejestruj się/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /zaloguj się/i })).toBeInTheDocument();
  });

  it("should display validation error if password is too short", async () => {
    renderComponent();
    fillForm("short", "short");
    await fireEvent.click(screen.getByRole("button", { name: /zarejestruj się/i }));
    expect(await screen.findByText(/hasło musi mieć co najmniej 8 znaków/i)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should display validation error if passwords do not match", async () => {
    renderComponent();
    fillForm("password123", "different123");
    await fireEvent.click(screen.getByRole("button", { name: /zarejestruj się/i }));
    expect(await screen.findByText(/hasła nie pasują/i)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should call fetch with correct data and display success message on successful registration", async () => {
    // Explicitly set success response for this test
    mockFetch.mockResolvedValueOnce(createSuccessResponse());

    renderComponent();
    fillForm();

    const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
    fireEvent.click(submitButton);

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/rejestracja zakończona pomyślnie/i)).toBeInTheDocument();
    });

    // Verify fetch was called once
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Verify that the fetch was called with a Request object that has the correct properties
    const fetchCall = mockFetch.mock.calls[0][0];
    expect(fetchCall.url).toContain("/api/auth/register");
    expect(fetchCall.method).toBe("POST");

    // If needed, we can also check that proper headers were sent
    const headers = Object.fromEntries(fetchCall.headers);
    expect(headers["content-type"]).toBe("application/json");
  });

  it("should display email confirmation message if API indicates it's required", async () => {
    // Mock confirmation required response
    mockFetch.mockResolvedValueOnce(createSuccessResponse({ success: true, requiresEmailConfirmation: true }));

    renderComponent();
    fillForm();
    await fireEvent.click(screen.getByRole("button", { name: /zarejestruj się/i }));

    // Check for success and confirmation messages
    await waitFor(() => {
      expect(screen.getByText(/rejestracja zakończona pomyślnie/i)).toBeInTheDocument();
      expect(screen.getByText(/link aktywacyjny/i)).toBeInTheDocument();
      expect(screen.getByText(/sprawdź swoją skrzynkę pocztową/i)).toBeInTheDocument();
    });
  });

  it("should redirect if fetch response is redirected", async () => {
    const redirectUrl = "/welcome";
    mockFetch.mockResolvedValueOnce(createRedirectResponse(redirectUrl));

    renderComponent();
    fillForm();
    await fireEvent.click(screen.getByRole("button", { name: /zarejestruj się/i }));

    // Wait for redirect
    await waitFor(() => {
      expect(mockAssign).toHaveBeenCalledWith(redirectUrl);
    });
  });

  it("should display server error message on failed API response", async () => {
    const errorMessage = "Ten email jest już używany";
    mockFetch.mockResolvedValueOnce(createErrorResponse(409, errorMessage));

    renderComponent();
    fillForm();
    await fireEvent.click(screen.getByRole("button", { name: /zarejestruj się/i }));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("should display generic server error message on network error", async () => {
    // Network error
    mockFetch.mockRejectedValueOnce(new Error("Network Error"));

    renderComponent();
    fillForm();
    await fireEvent.click(screen.getByRole("button", { name: /zarejestruj się/i }));

    // Wait for generic error message
    await waitFor(() => {
      expect(screen.getByText(/nie można połączyć się z serwerem/i)).toBeInTheDocument();
    });
  });
});

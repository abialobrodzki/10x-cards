import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegisterForm } from "../../../components/auth/RegisterForm";

// ----- Mockowanie globalnego fetch -----
// Remove global fetch mock - we will use vi.spyOn per test

// ----- Mockowanie window.location -----
const originalLocation = window.location;

// Create a spy for the href setter
const hrefSetSpy = vi.fn();

// Keep assign mock for potential future use or other tests
const locationAssignMock = vi.fn();

// Define the mock location object
const locationMock = {
  ...originalLocation, // Spread original properties
  assign: locationAssignMock,
  // Define href with a getter and our setter spy
  set href(url: string) {
    hrefSetSpy(url);
  },
  get href() {
    // You might need a way to track the *current* href if tests depend on reading it,
    // but for checking assignments, the setter spy is enough.
    // Returning an empty string or the last set value might work.
    return ""; // Simple getter for now
  },
};

// Replace window.location with our mock
Object.defineProperty(window, "location", {
  writable: true, // Allow tests to modify if needed, though unlikely now
  value: locationMock,
});

describe("RegisterForm", () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();
    vi.restoreAllMocks();
    // Reset the href setter spy calls
    hrefSetSpy.mockClear();
    // Also clear the assign mock just in case
    locationAssignMock.mockClear();
  });

  const renderComponent = () => {
    return render(<RegisterForm />);
  };

  const fillForm = () => {
    fireEvent.change(screen.getByLabelText(/imię/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/^hasło$/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/potwierdź hasło/i), { target: { value: "password123" } });
  };

  it("should render the registration form correctly", () => {
    // Arrange & Act
    renderComponent();

    // Assert
    expect(screen.getByLabelText(/imię/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^hasło$/i)).toBeInTheDocument(); // Używamy regex dla dokładności
    expect(screen.getByLabelText(/potwierdź hasło/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zarejestruj się/i })).toBeInTheDocument();
  });

  it("should display error message if passwords do not match", async () => {
    // Arrange
    // Spy on fetch to ensure it's not called
    const fetchSpy = vi.spyOn(global, "fetch");
    render(<RegisterForm />);
    fillForm(); // Wypełniamy poprawnie
    fireEvent.change(screen.getByLabelText(/potwierdź hasło/i), { target: { value: "differentPassword" } });
    const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });

    // Act
    fireEvent.click(submitButton);

    // Assert
    expect(await screen.findByText(/hasła nie są identyczne/i)).toBeInTheDocument();
    // Check that fetch was NOT called
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(hrefSetSpy).not.toHaveBeenCalled(); // Brak przekierowania
  });

  it("should call fetch with correct data, redirect on successful registration", async () => {
    // Arrange
    const expectedRedirectUrl = "/app/dashboard";
    // Spy on fetch and mock its implementation for this test
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ redirectUrl: expectedRedirectUrl }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    renderComponent();
    fillForm();
    const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });

    // Act
    fireEvent.click(submitButton);

    // Assert
    // Sprawdzenie stanu ładowania
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/rejestracja.../i);

    // Sprawdzenie wywołania fetch
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      // Check arguments passed to fetch directly
      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toBe("/api/auth/register");
      expect(options?.method).toBe("POST");
      expect(options?.headers).toEqual({
        // Use toEqual for object comparison
        "Content-Type": "application/json",
        Accept: "application/json",
      });
      expect(options?.body).toBe(
        JSON.stringify({ email: "test@example.com", password: "password123", name: "Test User" })
      );
    });

    // Sprawdzenie przekierowania (na podstawie mocka window.location)
    await waitFor(() => {
      // Check if href was set
      expect(hrefSetSpy).toHaveBeenCalledWith(expectedRedirectUrl);
    });
  });

  it("should redirect to login if redirectUrl is not provided in success response", async () => {
    // Arrange
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        // Empty JSON response
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    renderComponent();
    fillForm();
    const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });

    // Act
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(hrefSetSpy).toHaveBeenCalledWith("/login"); // Domyślne przekierowanie, check href set
    });
  });

  it("should redirect to response.url if response is redirected", async () => {
    // Arrange
    const redirectUrl = "/some/other/page";
    // Assuming the component checks for redirectUrl in the body even if redirected
    // If component logic differs, this mock needs adjustment
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ redirectUrl: redirectUrl }), {
        status: 200, // Or appropriate status causing the redirect check
        headers: { "Content-Type": "application/json" },
        // We can't directly set response.redirected = true on a standard Response
        // The component likely infers this or relies on the redirectUrl in the body.
      })
    );
    renderComponent();
    fillForm();
    const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });

    // Act
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(hrefSetSpy).toHaveBeenCalledWith(redirectUrl); // Check href set
    });
  });

  it("should display server error message on failed API response", async () => {
    // Arrange
    const errorMessage = "Email already exists";
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: errorMessage }), {
        status: 400, // Simulate a client error response
        headers: { "Content-Type": "application/json" },
      })
    );
    renderComponent();
    fillForm();
    const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });

    // Act
    fireEvent.click(submitButton);

    // Assert
    // Expect the specific error message now
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(submitButton).toBeEnabled(); // Powinien być znowu włączony
    expect(hrefSetSpy).not.toHaveBeenCalled(); // Check href was not set
  });

  it("should display generic server error message on network error", async () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fetchSpy = vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network Error"));
    renderComponent();
    fillForm();
    const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });

    // Act
    fireEvent.click(submitButton);

    // Assert
    expect(await screen.findByText(/wystąpił błąd podczas łączenia z serwerem/i)).toBeInTheDocument();
    expect(submitButton).toBeEnabled();
    expect(hrefSetSpy).not.toHaveBeenCalled(); // Check href was not set
  });
});

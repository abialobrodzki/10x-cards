import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LoadingIndicator from "../../components/ui/LoadingIndicator";

describe("LoadingIndicator", () => {
  const defaultProps = {
    isVisible: true,
  };

  const renderComponent = (props = {}) => {
    return render(<LoadingIndicator {...defaultProps} {...props} />);
  };

  it("should not render anything when isVisible is false", () => {
    // Arrange & Act
    const { container } = renderComponent({ isVisible: false });

    // Assert
    // Sprawdzamy, czy kontener jest pusty
    expect(container.firstChild).toBeNull();
  });

  it("should render the spinner and default message when isVisible is true", () => {
    // Arrange & Act
    renderComponent({ isVisible: true });

    // Assert
    // Sprawdzamy obecność domyślnego komunikatu
    expect(screen.getByText("Ładowanie...")).toBeInTheDocument();
    // Sprawdzamy obecność kontenera spinnera po data-testid
    expect(screen.getByTestId("loading-spinner-container")).toBeInTheDocument();
  });

  it("should render the spinner and custom message when provided", () => {
    // Arrange
    const customMessage = "Proszę czekać";

    // Act
    renderComponent({ isVisible: true, message: customMessage });

    // Assert
    expect(screen.getByText(customMessage)).toBeInTheDocument();
    expect(screen.queryByText("Ładowanie...")).not.toBeInTheDocument();
    // Sprawdzamy obecność kontenera spinnera po data-testid
    expect(screen.getByTestId("loading-spinner-container")).toBeInTheDocument();
  });

  it("should render only the spinner if message is an empty string", () => {
    // Arrange & Act
    renderComponent({ isVisible: true, message: "" });

    // Assert
    // Komunikat nie powinien być renderowany
    expect(screen.queryByText(/./)).not.toBeInTheDocument(); // Sprawdza brak jakiegokolwiek tekstu w paragrafie
    // Spinner powinien być nadal widoczny
    // Sprawdzamy obecność kontenera spinnera po data-testid
    expect(screen.getByTestId("loading-spinner-container")).toBeInTheDocument();
  });
});

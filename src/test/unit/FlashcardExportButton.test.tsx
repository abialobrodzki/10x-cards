import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import FlashcardExportButton from "../../components/flashcards/FlashcardExportButton";
import type { FlashcardDto } from "../../types";

// ----- Mockowanie funkcji DOM i URL -----
// Remove unused global mockLink
// const mockLink = {
//   setAttribute: vi.fn(),
//   click: vi.fn(),
//   href: "",
//   download: "",
// } as unknown as HTMLAnchorElement;

// Spy on createElement globally, providing our mockLink when 'a' is requested
const originalCreateElement = document.createElement;

// ----- Dane testowe -----
const mockFlashcards: FlashcardDto[] = [
  {
    id: 1,
    front: "Front 1, with comma",
    back: 'Back 1 with "quotes"',
    created_at: "2023-10-27T10:00:00Z",
    updated_at: "2023-10-27T10:00:00Z",
    source: "manual",
    generation_id: null,
  },
  {
    id: 2,
    front: "Front 2",
    back: "Back 2",
    created_at: "2023-10-28T11:00:00Z",
    updated_at: "2023-10-28T11:00:00Z",
    source: "ai-full",
    generation_id: null,
  },
];

describe("FlashcardExportButton", () => {
  // Create a reusable mock for the Blob constructor
  const mockBlobInstance = { size: 123, type: "text/csv;charset=utf-8;" }; // Simulate a Blob instance
  const mockBlobConstructor = vi.fn().mockImplementation(() => mockBlobInstance);

  // Stub the global Blob constructor with our mock (moved outside beforeEach)
  vi.stubGlobal("Blob", mockBlobConstructor);

  // Variable to hold the spy on document.createElement
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let createElementSpy: any; // Using any type due to difficulties with correctly typing vi.SpyInstance
  /* eslint-enable @typescript-eslint/no-explicit-any */
  // Variable to hold the latest created mock link
  let currentMockLink: HTMLAnchorElement | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    currentMockLink = null; // Reset mock link holder

    // Setup the spy inside beforeEach
    createElementSpy = vi.spyOn(document, "createElement");
    createElementSpy.mockImplementation((tagName: string): HTMLElement | HTMLAnchorElement => {
      if (tagName.toLowerCase() === "a") {
        // Create a NEW mock link for each call to createElement('a')
        const newMockLink = {
          setAttribute: vi.fn(),
          click: vi.fn(),
          href: "",
          download: "",
          // Add other properties/methods if needed by the component
          style: { display: "" },
          appendChild: vi.fn(),
          removeChild: vi.fn(),
          // Cast to unknown first, then to HTMLAnchorElement
        } as unknown as HTMLAnchorElement;
        // Store the newly created mock link so the test can access it
        currentMockLink = newMockLink;
        return newMockLink;
      }
      // For other tags, call the original implementation
      return originalCreateElement.call(document, tagName);
    });
  });

  afterEach(() => {
    createElementSpy.mockRestore();
  });

  const renderComponent = (props: Partial<React.ComponentProps<typeof FlashcardExportButton>> = {}) => {
    return render(<FlashcardExportButton flashcards={mockFlashcards} {...props} />);
  };

  it("should render the export button with icon and text", () => {
    // Arrange & Act
    renderComponent();

    // Assert
    const button = screen.getByRole("button", { name: /eksportuj csv/i });
    expect(button).toBeInTheDocument();
    expect(button.querySelector("svg")).toBeInTheDocument(); // Ikona
  });

  it("should disable the button if isDisabled prop is true", () => {
    // Arrange & Act
    renderComponent({ isDisabled: true });

    // Assert
    expect(screen.getByRole("button", { name: /eksportuj csv/i })).toBeDisabled();
  });

  it("should disable the button and change title if flashcards array is empty", () => {
    // Arrange & Act
    renderComponent({ flashcards: [] });

    // Assert
    const button = screen.getByRole("button", { name: /eksportuj csv/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", "Brak fiszek do eksportu");
  });

  it("should have correct title when enabled and flashcards exist", () => {
    // Arrange & Act
    renderComponent();

    // Assert
    const button = screen.getByRole("button", { name: /eksportuj csv/i });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute("title", "Eksportuj fiszki do CSV");
  });

  it("should trigger CSV download with correct data and filename on click", () => {
    // Arrange
    renderComponent();
    const button = screen.getByRole("button", { name: /eksportuj csv/i });

    // Act
    fireEvent.click(button);

    // Assert
    // 1. Check Blob creation
    expect(mockBlobConstructor).toHaveBeenCalledTimes(1);
    const blobContentArray = mockBlobConstructor.mock.calls[0][0]; // Get the first arg (content array)
    const blobOptions = mockBlobConstructor.mock.calls[0][1]; // Get the second arg (options)

    // Check content (assuming content is in the first element of the array)
    expect(blobContentArray[0]).toContain("ID,Przód,Tył,Źródło,Data utworzenia");
    expect(blobContentArray[0]).toContain('1,"Front 1, with comma","Back 1 with ""quotes""",manual');
    expect(blobContentArray[0]).toContain('2,"Front 2","Back 2",ai-full');

    // Check options
    expect(blobOptions).toEqual({ type: "text/csv;charset=utf-8;" });

    // 2. Check URL creation
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Object));

    // 3. Check link creation and access the CURRENT mock link
    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(currentMockLink).not.toBeNull(); // Ensure the mock link was created and captured

    // Perform assertions on the captured mock link
    expect(currentMockLink?.setAttribute).toHaveBeenCalledWith("href", expect.stringContaining("blob:")); // Check href (URL might vary)
    expect(currentMockLink?.setAttribute).toHaveBeenCalledWith(
      "download",
      expect.stringMatching(/^10xcards-export-\d{4}-\d{2}-\d{2}\.csv$/)
    );

    // 4. Check click simulation and cleanup
    expect(currentMockLink?.click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(expect.stringContaining("blob:")); // Check revoke with the URL
  });

  it("should not trigger download if button is disabled", () => {
    // Arrange
    renderComponent({ isDisabled: true });
    const button = screen.getByRole("button", { name: /eksportuj csv/i });

    // Act
    fireEvent.click(button);

    // Assert
    expect(createElementSpy).not.toHaveBeenCalledWith("a");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(currentMockLink).toBeNull(); // The link should not have been created
  });
});

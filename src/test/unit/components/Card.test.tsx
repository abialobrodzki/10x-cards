import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "../../../components/ui/card";

describe("Card Components", () => {
  // Card tests
  describe("Card", () => {
    it("renders with default props", () => {
      render(<Card data-testid="card">Card Content</Card>);
      const card = screen.getByTestId("card");
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent("Card Content");
      expect(card).toHaveClass("rounded-xl");
      expect(card).toHaveClass("border");
      expect(card).toHaveClass("shadow-sm");
    });

    it("applies custom className", () => {
      render(
        <Card data-testid="card" className="custom-class">
          Card Content
        </Card>
      );
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("custom-class");
      // Still has default classes
      expect(card).toHaveClass("rounded-xl");
    });

    it("handles click events", () => {
      const handleClick = vi.fn();
      render(
        <Card data-testid="card" onClick={handleClick}>
          Clickable Card
        </Card>
      );

      const card = screen.getByTestId("card");
      fireEvent.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  // CardHeader tests
  describe("CardHeader", () => {
    it("renders with default props", () => {
      render(<CardHeader data-testid="card-header">Header Content</CardHeader>);
      const header = screen.getByTestId("card-header");
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent("Header Content");
    });

    it("applies custom className", () => {
      render(
        <CardHeader data-testid="card-header" className="custom-header">
          Header Content
        </CardHeader>
      );
      const header = screen.getByTestId("card-header");
      expect(header).toHaveClass("custom-header");
    });
  });

  // CardTitle tests
  describe("CardTitle", () => {
    it("renders with default props", () => {
      render(<CardTitle data-testid="card-title">Card Title</CardTitle>);
      const title = screen.getByTestId("card-title");
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent("Card Title");
      expect(title).toHaveClass("font-semibold");
    });

    it("applies custom className", () => {
      render(
        <CardTitle data-testid="card-title" className="custom-title">
          Card Title
        </CardTitle>
      );
      const title = screen.getByTestId("card-title");
      expect(title).toHaveClass("custom-title");
      // Still has default classes
      expect(title).toHaveClass("font-semibold");
    });

    it("renders with HTML content", () => {
      render(
        <CardTitle data-testid="card-title">
          <span>HTML</span> Title
        </CardTitle>
      );
      const title = screen.getByTestId("card-title");
      expect(title).toContainHTML("<span>HTML</span>");
      expect(title).toHaveTextContent("HTML Title");
    });
  });

  // CardDescription tests
  describe("CardDescription", () => {
    it("renders with default props", () => {
      render(<CardDescription data-testid="card-description">Card Description</CardDescription>);
      const description = screen.getByTestId("card-description");
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent("Card Description");
      expect(description).toHaveClass("text-sm");
    });

    it("applies custom className", () => {
      render(
        <CardDescription data-testid="card-description" className="custom-desc">
          Card Description
        </CardDescription>
      );
      const description = screen.getByTestId("card-description");
      expect(description).toHaveClass("custom-desc");
      // Still has default classes
      expect(description).toHaveClass("text-sm");
    });

    it("handles long text content", () => {
      const longText =
        "This is a very long description that might wrap to multiple lines in the UI. We want to make sure it renders correctly and maintains its styling.";
      render(<CardDescription data-testid="card-description">{longText}</CardDescription>);
      const description = screen.getByTestId("card-description");
      expect(description).toHaveTextContent(longText);
    });
  });

  // CardAction tests
  describe("CardAction", () => {
    it("renders with default props", () => {
      render(<CardAction data-testid="card-action">Action</CardAction>);
      const action = screen.getByTestId("card-action");
      expect(action).toBeInTheDocument();
      expect(action).toHaveTextContent("Action");
      expect(action).toHaveClass("col-start-2");
      expect(action).toHaveClass("row-span-2");
    });

    it("applies custom className", () => {
      render(
        <CardAction data-testid="card-action" className="custom-action">
          Action
        </CardAction>
      );
      const action = screen.getByTestId("card-action");
      expect(action).toHaveClass("custom-action");
      // Still has default classes
      expect(action).toHaveClass("col-start-2");
    });

    it("renders with button content", () => {
      const handleClick = vi.fn();
      render(
        <CardAction data-testid="card-action">
          <button onClick={handleClick} data-testid="action-button">
            Click me
          </button>
        </CardAction>
      );

      const action = screen.getByTestId("card-action");
      const button = screen.getByTestId("action-button");

      expect(action).toContainElement(button);

      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  // CardContent tests
  describe("CardContent", () => {
    it("renders with default props", () => {
      render(<CardContent data-testid="card-content">Content</CardContent>);
      const content = screen.getByTestId("card-content");
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent("Content");
      expect(content).toHaveClass("px-6");
    });

    it("applies custom className", () => {
      render(
        <CardContent data-testid="card-content" className="custom-content">
          Content
        </CardContent>
      );
      const content = screen.getByTestId("card-content");
      expect(content).toHaveClass("custom-content");
      // Still has default classes
      expect(content).toHaveClass("px-6");
    });

    it("renders with complex nested content", () => {
      render(
        <CardContent data-testid="card-content">
          <div data-testid="nested-div">
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </CardContent>
      );

      const content = screen.getByTestId("card-content");
      const nestedDiv = screen.getByTestId("nested-div");

      expect(content).toContainElement(nestedDiv);
      expect(content).toHaveTextContent("Paragraph 1");
      expect(content).toHaveTextContent("Paragraph 2");
      expect(content).toHaveTextContent("Item 1");
      expect(content).toHaveTextContent("Item 2");
    });
  });

  // CardFooter tests
  describe("CardFooter", () => {
    it("renders with default props", () => {
      render(<CardFooter data-testid="card-footer">Footer</CardFooter>);
      const footer = screen.getByTestId("card-footer");
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveTextContent("Footer");
      expect(footer).toHaveClass("px-6");
    });

    it("applies custom className", () => {
      render(
        <CardFooter data-testid="card-footer" className="custom-footer">
          Footer
        </CardFooter>
      );
      const footer = screen.getByTestId("card-footer");
      expect(footer).toHaveClass("custom-footer");
      // Still has default classes
      expect(footer).toHaveClass("px-6");
    });

    it("renders with button elements", () => {
      const primaryClick = vi.fn();
      const secondaryClick = vi.fn();

      render(
        <CardFooter data-testid="card-footer">
          <button onClick={secondaryClick}>Cancel</button>
          <button onClick={primaryClick} data-testid="primary-button">
            Submit
          </button>
        </CardFooter>
      );

      const footer = screen.getByTestId("card-footer");
      expect(footer).toHaveTextContent("Cancel");
      expect(footer).toHaveTextContent("Submit");

      const primaryButton = screen.getByTestId("primary-button");
      fireEvent.click(primaryButton);
      expect(primaryClick).toHaveBeenCalledTimes(1);
    });
  });

  // Full card component integration test
  describe("Full Card Integration", () => {
    it("renders all subcomponents together correctly", () => {
      render(
        <Card data-testid="card" className="max-w-md">
          <CardHeader data-testid="card-header">
            <CardTitle data-testid="card-title">Card Title</CardTitle>
            <CardDescription data-testid="card-description">Card Description</CardDescription>
            <CardAction data-testid="card-action">
              <button data-testid="action-button">Action Button</button>
            </CardAction>
          </CardHeader>
          <CardContent data-testid="card-content">
            <p>Card Content</p>
          </CardContent>
          <CardFooter data-testid="card-footer">
            <p>Card Footer</p>
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId("card")).toBeInTheDocument();
      expect(screen.getByTestId("card-header")).toBeInTheDocument();
      expect(screen.getByTestId("card-title")).toHaveTextContent("Card Title");
      expect(screen.getByTestId("card-description")).toHaveTextContent("Card Description");
      expect(screen.getByTestId("card-action")).toContainElement(screen.getByTestId("action-button"));
      expect(screen.getByTestId("card-content")).toHaveTextContent("Card Content");
      expect(screen.getByTestId("card-footer")).toHaveTextContent("Card Footer");
    });

    it("handles interactive elements within the card", () => {
      const actionClick = vi.fn();
      const footerClick = vi.fn();

      render(
        <Card data-testid="card">
          <CardHeader data-testid="card-header">
            <CardTitle data-testid="card-title">Interactive Card</CardTitle>
            <CardAction data-testid="card-action">
              <button data-testid="action-button" onClick={actionClick}>
                Action
              </button>
            </CardAction>
          </CardHeader>
          <CardContent data-testid="card-content">
            <p>Card with interactive elements</p>
          </CardContent>
          <CardFooter data-testid="card-footer">
            <button data-testid="footer-button" onClick={footerClick}>
              Footer Action
            </button>
          </CardFooter>
        </Card>
      );

      // Verify structure
      expect(screen.getByTestId("card")).toContainElement(screen.getByTestId("card-header"));
      expect(screen.getByTestId("card")).toContainElement(screen.getByTestId("card-content"));
      expect(screen.getByTestId("card")).toContainElement(screen.getByTestId("card-footer"));

      // Test interactions
      fireEvent.click(screen.getByTestId("action-button"));
      expect(actionClick).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId("footer-button"));
      expect(footerClick).toHaveBeenCalledTimes(1);
    });

    it("renders multiple cards in a grid layout", () => {
      render(
        <div data-testid="card-grid" className="grid grid-cols-2 gap-4">
          <Card data-testid="card-1">
            <CardHeader>
              <CardTitle>Card 1</CardTitle>
            </CardHeader>
            <CardContent>Content 1</CardContent>
          </Card>
          <Card data-testid="card-2">
            <CardHeader>
              <CardTitle>Card 2</CardTitle>
            </CardHeader>
            <CardContent>Content 2</CardContent>
          </Card>
        </div>
      );

      expect(screen.getByTestId("card-grid")).toContainElement(screen.getByTestId("card-1"));
      expect(screen.getByTestId("card-grid")).toContainElement(screen.getByTestId("card-2"));
      expect(screen.getByTestId("card-1")).toHaveTextContent("Card 1");
      expect(screen.getByTestId("card-2")).toHaveTextContent("Card 2");
    });
  });
});

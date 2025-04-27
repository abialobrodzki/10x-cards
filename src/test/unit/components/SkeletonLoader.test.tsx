import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SkeletonLoader from "../../../components/ui/SkeletonLoader";

describe("SkeletonLoader", () => {
  const defaultProps = {
    isVisible: true,
  };

  const renderComponent = (props = {}) => {
    return render(<SkeletonLoader {...defaultProps} {...props} />);
  };

  it("should not render anything when isVisible is false", () => {
    // Arrange & Act
    const { container } = renderComponent({ isVisible: false });

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it("should render the default number of skeleton items (3) when visible", () => {
    // Arrange & Act
    renderComponent({ isVisible: true });

    // Assert
    // Szukamy głównych kontenerów szkieletów (z animacją)
    const skeletonItems = screen.getAllByLabelText("skeleton item"); // Użyjemy aria-label
    expect(skeletonItems).toHaveLength(3);
    // Sprawdzamy, czy każdy ma animację
    skeletonItems.forEach((item) => {
      expect(item).toHaveClass("animate-pulse");
    });
  });

  it("should render the specified number of skeleton items", () => {
    // Arrange & Act
    renderComponent({ isVisible: true, count: 5 });

    // Assert
    const skeletonItems = screen.getAllByLabelText("skeleton item");
    expect(skeletonItems).toHaveLength(5);
  });

  it("should apply additional className to the container div", () => {
    // Arrange
    const customClass = "my-custom-class";

    // Act
    const { container } = renderComponent({ isVisible: true, className: customClass });

    // Assert
    // Pierwszy element w kontenerze to główny div
    expect(container.firstChild).toHaveClass(customClass);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Avatar, AvatarImage, AvatarFallback } from "../../../components/ui/avatar";
import React from "react";

// Define an interface for the mocked Image component props
interface MockImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
}

// Mock Radix UI components
vi.mock("@radix-ui/react-avatar", () => ({
  Root: ({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { className?: string }) => (
    <span className={className} {...props} data-slot="avatar">
      {children}
    </span>
  ),
  Image: ({ src, alt, className, ...props }: MockImageProps) => (
    <img src={src} alt={alt} className={className} {...props} data-slot="avatar-image" />
  ),
  Fallback: ({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { className?: string }) => (
    <span className={className} {...props} data-slot="avatar-fallback">
      {children}
    </span>
  ),
}));

describe("Avatar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default props", () => {
    render(<Avatar data-testid="avatar-root" />);

    const avatar = screen.getByTestId("avatar-root");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass("size-8"); // Default size
  });

  it("renders with custom className", () => {
    render(<Avatar className="test-class bg-red-500" data-testid="avatar-root" />);

    const avatar = screen.getByTestId("avatar-root");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass("test-class");
    expect(avatar).toHaveClass("bg-red-500");
    // Still has default classes
    expect(avatar).toHaveClass("size-8");
    expect(avatar).toHaveClass("rounded-full");
  });

  it("renders with different sizes via custom class", () => {
    render(<Avatar className="size-16" data-testid="avatar-root" />);

    const avatar = screen.getByTestId("avatar-root");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass("size-16");
    // Default size class should be overridden
    expect(avatar).not.toHaveClass("size-8");
  });

  it("renders AvatarImage with src and alt props", () => {
    render(
      <Avatar data-testid="avatar-root">
        <AvatarImage data-testid="avatar-image" src="/test-image.jpg" alt="Test User" />
      </Avatar>
    );

    // Since we've mocked the component, we can expect it to be in the DOM
    const avatarImage = screen.getByTestId("avatar-image");
    expect(avatarImage).toBeInTheDocument();
    expect(avatarImage).toHaveAttribute("src", "/test-image.jpg");
    expect(avatarImage).toHaveAttribute("alt", "Test User");
  });

  it("applies custom className to AvatarImage", () => {
    render(
      <Avatar data-testid="avatar-root">
        <AvatarImage data-testid="avatar-image" className="custom-image-class" src="/test-image.jpg" alt="Test User" />
      </Avatar>
    );

    const avatarImage = screen.getByTestId("avatar-image");
    expect(avatarImage).toBeInTheDocument();
    expect(avatarImage).toHaveClass("custom-image-class");
  });

  it("renders AvatarFallback when provided", () => {
    render(
      <Avatar data-testid="avatar-root">
        <AvatarFallback data-testid="avatar-fallback">AB</AvatarFallback>
      </Avatar>
    );

    const fallback = screen.getByTestId("avatar-fallback");
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent("AB");
    expect(fallback).toHaveClass("bg-muted");
  });

  it("renders complete Avatar with image and fallback", () => {
    render(
      <Avatar data-testid="avatar-root">
        <AvatarImage data-testid="avatar-image" src="/test-image.jpg" alt="Test User" />
        <AvatarFallback data-testid="avatar-fallback">AB</AvatarFallback>
      </Avatar>
    );

    expect(screen.getByTestId("avatar-root")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-image")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-fallback")).toBeInTheDocument();
  });

  it("applies custom className to AvatarFallback", () => {
    render(
      <Avatar data-testid="avatar-root">
        <AvatarFallback data-testid="avatar-fallback" className="custom-fallback-class">
          AB
        </AvatarFallback>
      </Avatar>
    );

    const fallback = screen.getByTestId("avatar-fallback");
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveClass("custom-fallback-class");
    expect(fallback).toHaveClass("bg-muted");
  });

  it("can pass additional props to Avatar components", () => {
    const onClickMock = vi.fn();

    render(
      <Avatar data-testid="avatar-root" onClick={onClickMock}>
        <AvatarFallback data-testid="avatar-fallback">AB</AvatarFallback>
      </Avatar>
    );

    const avatar = screen.getByTestId("avatar-root");
    avatar.click();
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
});

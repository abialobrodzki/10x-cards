import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// A simple component to test
function HelloWorld({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}

describe("HelloWorld Component", () => {
  it("renders with the correct name", () => {
    render(<HelloWorld name="10xCards" />);
    expect(screen.getByText("Hello, 10xCards!")).toBeInTheDocument();
  });

  it("renders with a different name", () => {
    render(<HelloWorld name="Tester" />);
    expect(screen.getByText("Hello, Tester!")).toBeInTheDocument();
  });
});

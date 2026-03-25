import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MaterialIcon from "../../src/components/MaterialIcon.jsx";

describe("MaterialIcon", () => {
  it("renders icon name and custom size", () => {
    render(<MaterialIcon name="home" size={30} />);

    const icon = screen.getByText("home");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveStyle({ fontSize: "30px" });
  });
});

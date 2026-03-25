import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../src/components/Navbar.jsx", () => ({ default: () => <div>NAV</div> }));
vi.mock("../../../src/components/SectionNavButtons.jsx", () => ({ default: () => <div>SECTIONS</div> }));
vi.mock("../../../src/components/innovation/Cards.jsx", () => ({ default: () => <div>CARDS</div> }));

import Innovation from "../../../src/pages/innovation/Innovation.jsx";

describe("Innovation page", () => {
  it("renders title and composed blocks", () => {
    render(<Innovation />);

    expect(screen.getByText(/innovation/i)).toBeInTheDocument();
    expect(screen.getByText("NAV")).toBeInTheDocument();
    expect(screen.getByText("CARDS")).toBeInTheDocument();
  });
});

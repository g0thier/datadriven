import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/components/Navbar.jsx", () => ({ default: () => <div>NAVBAR</div> }));
vi.mock("../../src/components/SectionNavButtons.jsx", () => ({ default: () => <div>SECTION</div> }));

import Soon from "../../src/pages/Soon.jsx";

describe("Soon page", () => {
  it("renders title", () => {
    render(<Soon />);
    expect(screen.getByText(/À venir/i)).toBeInTheDocument();
  });
});

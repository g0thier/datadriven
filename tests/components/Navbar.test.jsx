import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/components/Profil.jsx", () => ({
  default: () => <div>PROFIL PANEL</div>,
}));

vi.mock("../../src/components/SectionNavButtons.jsx", () => ({
  default: () => <div>SECTION NAV</div>,
}));

vi.mock("../../src/components/MaterialIcon", () => ({
  default: () => <span>ICON</span>,
}));

import Navbar from "../../src/components/Navbar.jsx";

describe("Navbar", () => {
  it("toggles profile panel", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const aside = container.querySelector("aside");
    expect(aside.className).toContain("translate-x-full");

    await user.click(screen.getByRole("button", { name: /Profil/i }));
    expect(aside.className).toContain("translate-x-0");
  });
});

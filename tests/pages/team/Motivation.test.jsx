import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("../../../src/pages/quiz/index.js", () => ({
  QUIZZES: {
    "theorie-x-y": {
      id: "theorie-x-y",
      title: "Théorie X-Y",
      image: "img-1",
      author: "Douglas McGregor",
      description: "Desc",
      affirmations: [{ id: 1 }, { id: 2 }],
    },
  },
}));

vi.mock("../../../src/components/Navbar.jsx", () => ({ default: () => <div>NAV</div> }));
vi.mock("../../../src/components/SectionNavButtons.jsx", () => ({ default: () => <div>SECTIONS</div> }));

import Motivation from "../../../src/pages/team/Motivation.jsx";

describe("Motivation page", () => {
  it("renders quiz cards and navigates to quiz invitation", async () => {
    const user = userEvent.setup();
    render(<Motivation />);

    expect(screen.getByRole("heading", { name: "Motivation" })).toBeInTheDocument();
    expect(screen.getByText("Théorie X-Y")).toBeInTheDocument();

    await user.click(screen.getByText("Théorie X-Y"));

    expect(navigateMock).toHaveBeenCalledWith(
      "/team/motivation/invitation",
      expect.objectContaining({
        state: {
          quizId: "theorie-x-y",
        },
      })
    );
  });
});

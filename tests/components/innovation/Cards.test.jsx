import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("../../../src/workshops/index.js", () => ({
  WORKSHOPS: {
    "paper-brain": {
      id: "paper-brain",
      title: "Paper Brain",
      image: "img",
      steps: [{ duration: 5 }, { duration: 10 }],
      groupSize: "3+",
      benefits: ["Idea"],
    },
  },
}));

import Cards from "../../../src/components/innovation/Cards.jsx";

describe("innovation/Cards", () => {
  it("navigates to invitation with selected workshop", async () => {
    const user = userEvent.setup();
    render(<Cards />);

    await user.click(screen.getByText("Paper Brain"));

    expect(navigateMock).toHaveBeenCalledWith(
      "/innovation/invitation",
      expect.objectContaining({
        state: {
          workshopId: "paper-brain",
        },
      })
    );
  });
});

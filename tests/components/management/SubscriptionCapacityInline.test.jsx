import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../src/hooks/management/useAbonnementPage.js", () => ({
  default: () => ({
    companyRoleCounts: { owner: 1, leader: 2, colab: 3 },
    ownerLimit: 1,
    leaderLimit: 5,
    colabLimit: 10,
    isOwnerOverCapacity: false,
    isLeaderOverCapacity: false,
    isColabOverCapacity: false,
  }),
}));

import SubscriptionCapacityInline from "../../../src/components/management/SubscriptionCapacityInline.jsx";

describe("SubscriptionCapacityInline", () => {
  it("renders subscription role capacities", () => {
    render(<SubscriptionCapacityInline />);

    expect(screen.getAllByText(/capacité de votre abonnement/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("1 / 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2 / 5").length).toBeGreaterThan(0);
    expect(screen.getAllByText("3 / 10").length).toBeGreaterThan(0);
  });
});

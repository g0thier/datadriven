import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const handleStartCheckout = vi.fn();
const handleOpenBillingPortal = vi.fn();

vi.mock("../../../src/hooks/management/useAbonnementPage", () => ({
  default: () => ({
    loadingPlanName: "",
    isPortalLoading: false,
    actionError: "",
    statusMessage: { variant: "success", title: "Ok", message: "ok" },
    handleStartCheckout,
    handleOpenBillingPortal,
  }),
}));

vi.mock("../../../src/components/Navbar.jsx", () => ({ default: () => <div>NAVBAR</div> }));
vi.mock("../../../src/components/SectionNavButtons.jsx", () => ({ default: () => <div>SECTION</div> }));
vi.mock("../../../src/components/management/SubscriptionStatusMessage.jsx", () => ({ default: () => <div>STATUS</div> }));
vi.mock("../../../src/components/management/SubscriptionActionError.jsx", () => ({ default: () => <div>ERROR</div> }));
vi.mock("../../../src/components/management/SubscriptionCapacityInline.jsx", () => ({ default: () => <div>CAPACITY</div> }));
vi.mock("../../../src/components/management/ManageSubscriptionButton.jsx", () => ({
  default: ({ onClick }) => <button onClick={onClick}>PORTAL</button>,
}));
vi.mock("../../../src/components/management/Cards.jsx", () => ({
  default: ({ onSelectPlan }) => <button onClick={() => onSelectPlan("startup")}>PLAN</button>,
}));

import Abonnement from "../../../src/pages/management/Abonnement.jsx";

describe("Abonnement page", () => {
  it("wires checkout and portal actions", async () => {
    const user = userEvent.setup();
    render(<Abonnement />);

    await user.click(screen.getByRole("button", { name: "PORTAL" }));
    await user.click(screen.getByRole("button", { name: "PLAN" }));

    expect(handleOpenBillingPortal).toHaveBeenCalled();
    expect(handleStartCheckout).toHaveBeenCalledWith("startup");
  });
});

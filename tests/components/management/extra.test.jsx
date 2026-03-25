import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Cards from "../../../src/components/management/Cards.jsx";
import ManageSubscriptionButton from "../../../src/components/management/ManageSubscriptionButton.jsx";
import SubscriptionStatusMessage from "../../../src/components/management/SubscriptionStatusMessage.jsx";
import SubscriptionActionError from "../../../src/components/management/SubscriptionActionError.jsx";
import ManagerSummary from "../../../src/components/management/ManagerSummary.jsx";
import CollaboratorSearchPanel from "../../../src/components/management/CollaboratorSearchPanel.jsx";

describe("management components extras", () => {
  it("handles card plan selection", async () => {
    const user = userEvent.setup();
    const onSelectPlan = vi.fn();

    render(
      <Cards
        plans={[
          {
            name: "Startup",
            image: "img",
            monthlyPrice: 49,
            description: "Desc",
            owner: 1,
            leader: 3,
            colab: 10,
            benefits: ["x"],
          },
        ]}
        onSelectPlan={onSelectPlan}
      />
    );

    await user.click(screen.getByRole("button"));
    expect(onSelectPlan).toHaveBeenCalledWith("Startup");
  });

  it("renders status/error and handles manage button", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <>
        <ManageSubscriptionButton onClick={onClick} />
        <SubscriptionStatusMessage statusMessage={{ variant: "success", title: "OK", message: "Done" }} />
        <SubscriptionActionError message="Oops" />
      </>
    );

    expect(screen.getByText("OK")).toBeInTheDocument();
    expect(screen.getByText("Oops")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /gérer mon abonnement/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders manager summary and collaborator promotion", async () => {
    const user = userEvent.setup();
    const onPromoteCollaborator = vi.fn();

    render(
      <>
        <ManagerSummary
          selectedManager={{ label: { title: "Ada", subtitle: "Leader" } }}
          selectedDepartmentsCount={1}
          totalDepartmentsCount={2}
          selectedLevel2PagesCount={2}
          totalLevel2PagesCount={4}
        />
        <CollaboratorSearchPanel
          collaborators={[
            {
              collaboratorId: "c1",
              displayName: "Alan",
              email: "alan@example.com",
              searchLabel: "Alan alan@example.com",
            },
          ]}
          onPromoteCollaborator={onPromoteCollaborator}
          promotingCollaboratorId=""
          promotionError=""
        />
      </>
    );

    expect(screen.getByText("Ada")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/nom ou email/i), "alan");
    await user.click(screen.getByRole("button", { name: /alan/i }));
    expect(onPromoteCollaborator).toHaveBeenCalledWith("c1");
  });
});

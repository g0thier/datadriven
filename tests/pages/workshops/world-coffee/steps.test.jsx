import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Step1 from "../../../../src/pages/workshops/world-coffee/steps/Step1.jsx";
import Step2 from "../../../../src/pages/workshops/world-coffee/steps/Step2.jsx";
import Step3 from "../../../../src/pages/workshops/world-coffee/steps/Step3.jsx";
import Step4 from "../../../../src/pages/workshops/world-coffee/steps/Step4.jsx";
import Step5 from "../../../../src/pages/workshops/world-coffee/steps/Step5.jsx";
import Step6 from "../../../../src/pages/workshops/world-coffee/steps/Step6.jsx";
import Step7 from "../../../../src/pages/workshops/world-coffee/steps/Step7.jsx";

describe("world-coffee steps", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders step 1 and handles description actions", async () => {
    const user = userEvent.setup();
    const addDescription = vi.fn(async () => "d2");
    const updateDescription = vi.fn();
    const removeDescription = vi.fn();

    render(
      <Step1
        sessionTitle="WC"
        step={{ label: "S1", description: ["desc"] }}
        collaboration={{
          descriptions: [{ id: "d1", text: "Sujet 1" }],
          actions: { addDescription, updateDescription, removeDescription },
        }}
      />
    );

    await user.type(screen.getByDisplayValue("Sujet 1"), " maj");
    await user.click(screen.getByLabelText(/supprimer la description/i));
    await user.click(screen.getByLabelText(/ajouter une description/i));

    expect(updateDescription).toHaveBeenCalled();
    expect(removeDescription).toHaveBeenCalledWith("d1");
    expect(addDescription).toHaveBeenCalled();
  });

  it("renders step 2 and handles facilitator assignment/removal", async () => {
    const user = userEvent.setup();
    const setFacilitator = vi.fn();
    const clearFacilitator = vi.fn();

    render(
      <Step2
        sessionTitle="WC"
        step={{ label: "S2", description: ["desc"] }}
        collaboration={{
          descriptions: [
            { id: "d1", text: "Sujet A" },
            { id: "d2", text: "Sujet B" },
          ],
          participants: [
            { id: "u1", firstName: "Ada", lastName: "Lovelace" },
            { id: "u2", firstName: "Alan", lastName: "Turing" },
          ],
          facilitatorByDescriptionId: { d1: "u1" },
          hasUnassignedDescriptions: true,
          actions: { setFacilitator, clearFacilitator },
        }}
      />
    );

    await user.click(screen.getByTitle(/retirer ada lovelace/i));
    await user.click(screen.getAllByTitle(/alan turing/i)[0]);

    expect(clearFacilitator).toHaveBeenCalledWith("d1");
    expect(setFacilitator).toHaveBeenCalled();
  });

  it("renders step 3 and handles idea actions", async () => {
    const user = userEvent.setup();
    const addIdea = vi.fn(async () => "i2");
    const updateIdeaText = vi.fn();
    const removeIdea = vi.fn();

    render(
      <Step3
        sessionTitle="WC"
        step={{ label: "S3", description: [] }}
        collaboration={{
          participant: { id: "u1" },
          activeSubgroup: { id: "group-1", label: "Sous-groupe 1", facilitatorId: "u2" },
          activeSubgroupDescription: { text: "Sujet principal" },
          activeIdeas: [
            { id: "i1", authorId: "u1", text: "Mon idee" },
            { id: "iX", authorId: "u2", text: "Idee autre" },
          ],
          getParticipantLabel: () => "Alan Turing",
          actions: { addIdea, updateIdeaText, removeIdea },
        }}
      />
    );

    await user.type(screen.getByDisplayValue("Mon idee"), " ++");
    await user.click(screen.getByLabelText(/supprimer l'idée/i));
    await user.click(screen.getByLabelText(/ajouter une idée/i));

    expect(updateIdeaText).toHaveBeenCalled();
    expect(removeIdea).toHaveBeenCalledWith("i1");
    expect(addIdea).toHaveBeenCalled();
  });

  it("renders step 4, auto-triggers round 2 rotation, and edits comments", async () => {
    const user = userEvent.setup();
    const ensureRound2Rotation = vi.fn();
    const addIdeaComment = vi.fn();
    const updateIdeaCommentText = vi.fn();
    const removeIdeaComment = vi.fn();

    const baseCollaboration = {
      participant: { id: "u1" },
      descriptions: [{ id: "d1", text: "Sujet principal" }],
      hasUnassignedDescriptions: false,
      subgroups: [{ id: "group-1", label: "Sous-groupe 1", facilitatorId: "u2" }],
      activeSubgroup: { id: "group-1", label: "Sous-groupe 1", facilitatorId: "u2" },
      activeSubgroupDescription: { text: "Sujet principal" },
      activeIdeas: [{ id: "i1", text: "Idee 1", roundId: "round-1" }],
      commentsByIdea: {
        i1: [{ id: "c1", text: "Commentaire 1", roundId: "round-2" }],
      },
      getParticipantLabel: () => "Alan Turing",
      actions: {
        ensureRound2Rotation,
        addIdeaComment,
        updateIdeaCommentText,
        removeIdeaComment,
      },
    };

    const { rerender } = render(
      <Step4
        sessionTitle="WC"
        step={{ label: "S4", description: [] }}
        session={{ sessionId: "s1" }}
        collaboration={{ ...baseCollaboration, round2RotationApplied: false }}
      />
    );

    expect(screen.getByText(/permutation des groupes en cours/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(ensureRound2Rotation).toHaveBeenCalled();
    });

    rerender(
      <Step4
        sessionTitle="WC"
        step={{ label: "S4", description: [] }}
        session={{ sessionId: "s1" }}
        collaboration={{ ...baseCollaboration, round2RotationApplied: true }}
      />
    );

    await user.type(screen.getByDisplayValue("Commentaire 1"), " ++");
    await user.click(screen.getByLabelText(/supprimer le commentaire/i));
    await user.click(screen.getByLabelText(/enrichir l'idée/i));

    expect(updateIdeaCommentText).toHaveBeenCalled();
    expect(removeIdeaComment).toHaveBeenCalledWith("i1", "c1");
    expect(addIdeaComment).toHaveBeenCalledWith("i1", "");
  });

  it("renders step 5, auto-triggers round 3 rotation, and edits replies", async () => {
    const user = userEvent.setup();
    const ensureRound3Rotation = vi.fn();
    const addCommentReply = vi.fn();
    const updateCommentReplyText = vi.fn();
    const removeCommentReply = vi.fn();

    const baseCollaboration = {
      participant: { id: "u1" },
      descriptions: [{ id: "d1", text: "Sujet principal" }],
      hasUnassignedDescriptions: false,
      subgroups: [{ id: "group-1", label: "Sous-groupe 1", facilitatorId: "u2" }],
      activeSubgroup: { id: "group-1", label: "Sous-groupe 1", facilitatorId: "u2" },
      activeSubgroupDescription: { text: "Sujet principal" },
      activeIdeas: [{ id: "i1", text: "Idee 1", roundId: "round-1" }],
      commentsByIdea: {
        i1: [{ id: "c1", text: "Commentaire 1", roundId: "round-2" }],
      },
      repliesByComment: {
        c1: [{ id: "r1", text: "Reponse c1", roundId: "round-3" }],
        "idea-i1": [{ id: "r2", text: "Reponse idee", roundId: "round-3" }],
      },
      getParticipantLabel: () => "Alan Turing",
      actions: {
        ensureRound3Rotation,
        addCommentReply,
        updateCommentReplyText,
        removeCommentReply,
      },
    };

    const { rerender } = render(
      <Step5
        sessionTitle="WC"
        step={{ label: "S5", description: [] }}
        session={{ sessionId: "s1" }}
        collaboration={{ ...baseCollaboration, round3RotationApplied: false }}
      />
    );

    expect(screen.getByText(/permutation des groupes en cours/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(ensureRound3Rotation).toHaveBeenCalled();
    });

    rerender(
      <Step5
        sessionTitle="WC"
        step={{ label: "S5", description: [] }}
        session={{ sessionId: "s1" }}
        collaboration={{ ...baseCollaboration, round3RotationApplied: true }}
      />
    );

    await user.type(screen.getByDisplayValue("Reponse c1"), " ++");
    await user.click(screen.getByLabelText(/supprimer la réponse/i));
    await user.click(screen.getAllByLabelText(/sur-enrichir l'idée/i)[0]);

    expect(updateCommentReplyText).toHaveBeenCalled();
    expect(removeCommentReply).toHaveBeenCalled();
    expect(addCommentReply).toHaveBeenCalled();
  });

  it("renders step 6, auto-triggers return rotation, and edits subgroup synthesis", async () => {
    const user = userEvent.setup();
    const ensureReturnRotation = vi.fn();
    const updateSubgroupSynthesis = vi.fn();

    const baseCollaboration = {
      participant: { id: "u1" },
      descriptions: [{ id: "d1", text: "Sujet principal" }],
      hasUnassignedDescriptions: false,
      subgroups: [{ id: "group-1", label: "Sous-groupe 1", facilitatorId: "u2" }],
      activeSubgroup: { id: "group-1", label: "Sous-groupe 1", facilitatorId: "u2" },
      activeSubgroupDescription: { text: "Sujet principal" },
      activeSubgroupSynthesis: { text: "Synthese initiale" },
      activeIdeas: [{ id: "i1", text: "Idee 1", roundId: "round-1" }],
      commentsByIdea: {
        i1: [{ id: "c1", text: "Commentaire 1", roundId: "round-2" }],
      },
      repliesByComment: {
        c1: [{ id: "r1", text: "Reponse c1", roundId: "round-3" }],
      },
      getParticipantLabel: () => "Alan Turing",
      actions: {
        ensureReturnRotation,
        updateSubgroupSynthesis,
      },
    };

    const { rerender } = render(
      <Step6
        sessionTitle="WC"
        step={{ label: "S6", description: [] }}
        session={{ sessionId: "s1" }}
        collaboration={{ ...baseCollaboration, returnRotationApplied: false }}
      />
    );

    expect(screen.getByText(/retour des groupes en cours/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(ensureReturnRotation).toHaveBeenCalled();
    });

    rerender(
      <Step6
        sessionTitle="WC"
        step={{ label: "S6", description: [] }}
        session={{ sessionId: "s1" }}
        collaboration={{ ...baseCollaboration, returnRotationApplied: true }}
      />
    );

    await user.type(screen.getByPlaceholderText(/synthèse du groupe/i), " ++");
    expect(updateSubgroupSynthesis).toHaveBeenCalled();
  });

  it("renders step 7 restitution view in smoke mode", () => {
    render(
      <Step7
        sessionTitle="WC"
        step={{ label: "S7", description: [] }}
        collaboration={{
          subgroups: [{ id: "group-1", label: "Sous-groupe 1", descriptionId: "d1", participantIds: ["u1"] }],
          descriptions: [{ id: "d1", text: "Sujet final" }],
          synthesisBySubgroup: { "group-1": { text: "Synthese" } },
          ideasBySubgroup: { "group-1": [] },
          commentsByIdea: {},
          repliesByComment: {},
        }}
      />
    );

    expect(screen.getByRole("heading", { name: /sous-groupe 1/i })).toBeInTheDocument();
    expect(screen.getByText(/sujet final/i)).toBeInTheDocument();
  });
});

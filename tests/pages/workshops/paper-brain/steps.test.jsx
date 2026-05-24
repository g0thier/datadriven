import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Step2 from "../../../../src/pages/workshops/paper-brain/steps/Step2.jsx";

describe("paper-brain steps", () => {
  it("renders step2 in smoke mode", () => {
    const addNote = vi.fn(async () => "n2");

    const shared = {
      description: "Défi",
      participant: { id: "p1" },
      myNotes: [{ id: "n1", text: "Idea" }],
      actions: {
        addNote,
        updateNoteText: vi.fn(),
        removeNote: vi.fn(),
        addComment: vi.fn(),
        updateCommentText: vi.fn(),
        removeComment: vi.fn(),
        setNotePosition: vi.fn(),
        toggleVote: vi.fn(),
      },
      getParticipantLabel: () => "Participant",
    };

    render(
      <Step2
        step={{ label: "S2", description: [] }}
        sessionTitle="PB"
        collaboration={shared}
        session={{ sessionId: "s1" }}
      />
    );

    expect(screen.getByText(/défi/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/écrivez une idée/i)).toBeInTheDocument();
  });
});

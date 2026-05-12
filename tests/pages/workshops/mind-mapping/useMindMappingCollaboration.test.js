import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "../../../helpers/renderHook.js";

let authCallback;

const firebaseMocks = {
  auth: { currentUser: { uid: "u1", email: "ada@example.com", displayName: "Ada" } },
  onAuthStateChangedListener: vi.fn((cb) => {
    authCallback = cb;
    return () => {};
  }),
};

const mindMappingServiceMocks = {
  addMindMappingConcept: vi.fn(),
  addMindMappingComment: vi.fn(),
  createMindMappingNote: vi.fn(),
  removeMindMappingConcept: vi.fn(),
  removeMindMappingComment: vi.fn(),
  removeMindMappingNote: vi.fn(),
  setReformulation: vi.fn(),
  setMindMappingStep1Description: vi.fn(),
  subscribeMindMappingSession: vi.fn(),
  toggleMindMappingConceptVote: vi.fn(),
  updateMindMappingConcept: vi.fn(),
  updateMindMappingComment: vi.fn(),
  updateMindMappingNote: vi.fn(),
  upsertMindMappingParticipant: vi.fn(),
};

vi.mock("../../../../src/firebase", () => firebaseMocks);
vi.mock("../../../../src/firebase/workshops/mind-mapping.service", () => mindMappingServiceMocks);

describe("useMindMappingCollaboration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mindMappingServiceMocks.subscribeMindMappingSession.mockImplementation((_sessionId, onData) => {
      onData({
        step1: { description: "Challenge" },
        notes: {
          n1: { id: "n1", authorId: "u1", text: "Note 1", createdAt: "2026-03-25T10:00:00.000Z" },
          n2: { id: "n2", authorId: "u2", text: "Note 2", createdAt: "2026-03-25T10:10:00.000Z" },
        },
        commentsByNote: {
          n1: { c1: { id: "c1", authorId: "u1", text: "Idee 1", createdAt: "2026-03-25T10:20:00.000Z" } },
          n2: { c2: { id: "c2", authorId: "u2", text: "Idee 2", createdAt: "2026-03-25T10:30:00.000Z" } },
        },
        concepts: {
          k1: {
            id: "k1",
            authorId: "u1",
            text: "Concept 1",
            from: { noteId: "n1", ideaId: "c1" },
            to: { noteId: "n2", ideaId: "c2" },
            createdAt: "2026-03-25T10:40:00.000Z",
          },
        },
        votesByParticipant: {
          u1: { k1: true },
          u2: { k1: true },
        },
        reformulationsByConcept: {
          k1: { text: "Reform initiale" },
        },
        participants: {
          u1: { id: "u1", name: "Ada" },
          u2: { id: "u2", name: "Alan" },
        },
      });

      return () => {};
    });

    mindMappingServiceMocks.upsertMindMappingParticipant.mockResolvedValue(undefined);
    mindMappingServiceMocks.setMindMappingStep1Description.mockResolvedValue(undefined);
    mindMappingServiceMocks.createMindMappingNote.mockResolvedValue("n3");
    mindMappingServiceMocks.updateMindMappingNote.mockResolvedValue(undefined);
    mindMappingServiceMocks.removeMindMappingNote.mockResolvedValue(undefined);
    mindMappingServiceMocks.addMindMappingComment.mockResolvedValue("c3");
    mindMappingServiceMocks.updateMindMappingComment.mockResolvedValue(undefined);
    mindMappingServiceMocks.removeMindMappingComment.mockResolvedValue(undefined);
    mindMappingServiceMocks.addMindMappingConcept.mockResolvedValue("k2");
    mindMappingServiceMocks.updateMindMappingConcept.mockResolvedValue(undefined);
    mindMappingServiceMocks.removeMindMappingConcept.mockResolvedValue(undefined);
    mindMappingServiceMocks.toggleMindMappingConceptVote.mockResolvedValue({
      committed: true,
      votes: { k1: true },
    });
    mindMappingServiceMocks.setReformulation.mockResolvedValue(undefined);
  });

  it("stays disabled for non mind-mapping workshop", async () => {
    const { default: useMindMappingCollaboration } = await import(
      "../../../../src/pages/workshops/mind-mapping/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useMindMappingCollaboration({ sessionId: "s1", session: {}, workshopId: "other" })
    );

    expect(hook.result.isEnabled).toBe(false);
    await hook.unmount();
  });

  it("hydrates state and executes actions", async () => {
    const { default: useMindMappingCollaboration } = await import(
      "../../../../src/pages/workshops/mind-mapping/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useMindMappingCollaboration({
        sessionId: "s1",
        workshopId: "mind-mapping",
        session: {
          allGuests: [
            { id: "u1", firstName: "Ada", lastName: "Lovelace" },
            { id: "u2", name: "Alan" },
          ],
        },
      })
    );

    await act(async () => {
      authCallback({ uid: "u1", email: "ada@example.com", displayName: "Ada" });
    });

    await waitFor(() => {
      expect(hook.result.isEnabled).toBe(true);
      expect(hook.result.participantReady).toBe(true);
      expect(hook.result.step1Description).toBe("Challenge");
      expect(hook.result.notes).toHaveLength(2);
      expect(hook.result.concepts).toHaveLength(1);
      expect(hook.result.reformulationsByConcept.k1.text).toBe("Reform initiale");
    });

    await act(async () => {
      await hook.result.actions.setStep1Description("Sujet mis a jour");
      await hook.result.actions.addNote({ text: "Nouvelle note" });
      await hook.result.actions.updateNoteText("n1", "Note modifiee");
      await hook.result.actions.removeNote("n1");
      await hook.result.actions.addComment("n1", "Nouvelle idee");
      await hook.result.actions.updateCommentText("n1", "c1", "Idee modifiee");
      await hook.result.actions.removeComment("n1", "c1");
      await hook.result.actions.addConcept({
        fromNoteId: "n1",
        fromIdeaId: "c1",
        toNoteId: "n2",
        toIdeaId: "c2",
        text: "Concept relie",
      });
      await hook.result.actions.updateConceptText("k1", "Concept modifie");
      await hook.result.actions.removeConcept("k1");
      await hook.result.actions.toggleConceptVote("k1");
      await hook.result.actions.setReformulation("k1", "Reform finale");
    });

    expect(mindMappingServiceMocks.setMindMappingStep1Description).toHaveBeenCalled();
    expect(mindMappingServiceMocks.createMindMappingNote).toHaveBeenCalled();
    expect(mindMappingServiceMocks.updateMindMappingNote).toHaveBeenCalled();
    expect(mindMappingServiceMocks.removeMindMappingNote).toHaveBeenCalled();
    expect(mindMappingServiceMocks.addMindMappingComment).toHaveBeenCalled();
    expect(mindMappingServiceMocks.updateMindMappingComment).toHaveBeenCalled();
    expect(mindMappingServiceMocks.removeMindMappingComment).toHaveBeenCalled();
    expect(mindMappingServiceMocks.addMindMappingConcept).toHaveBeenCalled();
    expect(mindMappingServiceMocks.updateMindMappingConcept).toHaveBeenCalled();
    expect(mindMappingServiceMocks.removeMindMappingConcept).toHaveBeenCalled();
    expect(mindMappingServiceMocks.toggleMindMappingConceptVote).toHaveBeenCalled();
    expect(mindMappingServiceMocks.setReformulation).toHaveBeenCalled();

    await hook.unmount();
  });

  it("surfaces sync error from subscription", async () => {
    mindMappingServiceMocks.subscribeMindMappingSession.mockImplementation(
      (_sessionId, _onData, onError) => {
        onError(new Error("sync failed"));
        return () => {};
      }
    );

    const { default: useMindMappingCollaboration } = await import(
      "../../../../src/pages/workshops/mind-mapping/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useMindMappingCollaboration({ sessionId: "s1", workshopId: "mind-mapping", session: {} })
    );

    await act(async () => {
      authCallback({ uid: "u1", email: "ada@example.com", displayName: "Ada" });
    });

    await waitFor(() => {
      expect(hook.result.syncError.length).toBeGreaterThan(0);
    });

    await hook.unmount();
  });
});

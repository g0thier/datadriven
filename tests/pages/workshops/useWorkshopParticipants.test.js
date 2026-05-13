import { describe, expect, it } from "vitest";
import { useWorkshopParticipants } from "../../../src/pages/workshops/useWorkshopParticipants.js";
import { renderHook } from "../../helpers/renderHook.js";

describe("useWorkshopParticipants", () => {
  it("builds default participants with deduplication, fallback labels and lookups", async () => {
    const hook = await renderHook(() =>
      useWorkshopParticipants({
        sessionGuests: [
          { id: "guest-1", firstName: "Guest", lastName: "One", email: "guest1@example.com" },
          { email: "guest-only-email@example.com" },
        ],
        remoteParticipants: {
          "guest-1": { name: "Remote Guest", email: "remote-guest@example.com", isAuthenticated: true },
          "remote-1": { name: "Remote One", email: "remote1@example.com", isAuthenticated: false },
          "": { name: "Invalid" },
        },
        currentParticipant: { id: "authored-1", name: "Current User", email: "current@example.com", isAuthenticated: true },
        authoredParticipantIds: ["remote-1", "authored-1", "abcd1", "", "   ", null],
        variant: "default",
        mergeOrder: ["guests", "remote", "authored", "current"],
      })
    );

    const { participants, participantById, getParticipantLabel } = hook.result;

    expect(participants.map((participant) => participant.id)).toEqual([
      "authored-1",
      "guest-only-email@example.com",
      "abcd1",
      "guest-1",
      "remote-1",
    ]);

    expect(participantById["guest-1"]).toMatchObject({
      id: "guest-1",
      name: "Remote Guest",
      email: "remote-guest@example.com",
      isAuthenticated: true,
    });
    expect(participantById["authored-1"]).toMatchObject({
      id: "authored-1",
      name: "Current User",
      email: "current@example.com",
      isAuthenticated: true,
    });
    expect(participantById["abcd1"].name).toBe("Participant BCD1");
    expect(getParticipantLabel("abcd1")).toBe("Participant BCD1");
    expect(getParticipantLabel("")).toBe("Participant");

    await hook.unmount();
  });

  it("respects mergeOrder precedence", async () => {
    const hook = await renderHook(() =>
      useWorkshopParticipants({
        sessionGuests: [{ id: "shared-1", name: "Guest Name", email: "guest@example.com" }],
        remoteParticipants: {
          "shared-1": { name: "Remote Name", email: "remote@example.com", isAuthenticated: true },
        },
        currentParticipant: null,
        authoredParticipantIds: [],
        variant: "default",
        mergeOrder: ["remote", "guests", "authored", "current"],
      })
    );

    expect(hook.result.participantById["shared-1"]).toMatchObject({
      name: "Guest Name",
      email: "guest@example.com",
      isAuthenticated: true,
    });

    await hook.unmount();
  });

  it("keeps world-coffee enriched shape and label behavior", async () => {
    const hook = await renderHook(() =>
      useWorkshopParticipants({
        sessionGuests: [
          {
            id: "wc-guest",
            firstName: "Ada",
            lastName: "Lovelace",
            label: "Ada L.",
            email: "ada@example.com",
          },
        ],
        remoteParticipants: {
          "wc-guest": {
            firstName: "A.",
            lastName: "Remote",
            name: "Remote Ada",
            label: "Remote Label",
            email: "remote-ada@example.com",
          },
          "wc-remote-only": {
            label: "Remote Only",
            email: "wc-remote-only@example.com",
          },
        },
        currentParticipant: {
          id: "wc-current",
          firstName: "",
          lastName: "",
          name: "",
          label: "",
          email: "",
        },
        authoredParticipantIds: ["ignored-in-merge-order"],
        variant: "world-coffee",
        mergeOrder: ["remote", "guests", "current"],
      })
    );

    const { participantById, getParticipantLabel } = hook.result;

    expect(participantById["wc-guest"]).toMatchObject({
      id: "wc-guest",
      firstName: "Ada",
      lastName: "Lovelace",
      name: "Ada Lovelace",
      label: "Ada L.",
      email: "ada@example.com",
    });
    expect(participantById["wc-remote-only"]).toMatchObject({
      id: "wc-remote-only",
      name: "Remote Only",
      label: "Remote Only",
    });
    expect(participantById["wc-current"].name).toBe("Participant RENT");
    expect(getParticipantLabel("wc-current")).toBe("Participant RENT");
    expect(getParticipantLabel("missing-id")).toBe("Participant G-ID");

    await hook.unmount();
  });
});

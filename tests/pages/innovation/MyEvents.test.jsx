import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

let authListener;
const { firebaseMock } = vi.hoisted(() => ({
  firebaseMock: {
    auth: { currentUser: null },
    onAuthStateChangedListener: vi.fn((cb) => {
      authListener = cb;
      return () => {};
    }),
    subscribeUserWorkshopSessions: vi.fn((uid, onSuccess, onError) => {
      return () => {};
    }),
  },
}));

vi.mock("../../../src/firebase", () => firebaseMock);
vi.mock("../../../src/components/Navbar.jsx", () => ({ default: () => <div>NAV</div> }));
vi.mock("../../../src/components/SectionNavButtons.jsx", () => ({ default: () => <div>SECTIONS</div> }));

import MyEvents from "../../../src/pages/innovation/MyEvents.jsx";

describe("MyEvents page", () => {
  it("loads events and renders join/summary and unavailable fallback", async () => {
    render(
      <MemoryRouter>
        <MyEvents />
      </MemoryRouter>
    );

    await act(async () => {
      authListener({ uid: "u1" });
    });

    await waitFor(() => {
      expect(firebaseMock.subscribeUserWorkshopSessions).toHaveBeenCalled();
    });

    const onSuccess = firebaseMock.subscribeUserWorkshopSessions.mock.calls.at(-1)[1];

    await act(async () => {
      onSuccess([
        {
          sessionId: "future-1",
          workshopId: "paper-brain",
          workshopTitle: "Atelier futur",
          workshopDateTime: "2099-01-01T10:00:00Z",
          status: "scheduled",
        },
        {
          sessionId: "past-1",
          workshopId: "paper-brain",
          workshopTitle: "Atelier passé",
          workshopDateTime: "2000-01-01T10:00:00Z",
          status: "completed",
        },
        {
          sessionId: "broken",
          workshopTitle: "Sans lien",
          workshopDateTime: "2099-01-02T10:00:00Z",
          status: "scheduled",
        },
      ]);
    });

    expect(screen.getByText(/atelier futur/i)).toBeInTheDocument();
    expect(screen.getByText(/atelier passé/i)).toBeInTheDocument();
    expect(screen.getByText(/rejoindre l'atelier/i)).toBeInTheDocument();
    expect(screen.getByText(/voir le résumé/i)).toBeInTheDocument();
    expect(screen.getByText(/lien indisponible/i)).toBeInTheDocument();
  });

  it("renders loading error from session subscription", async () => {
    render(
      <MemoryRouter>
        <MyEvents />
      </MemoryRouter>
    );

    await act(async () => {
      authListener({ uid: "u1" });
    });

    await waitFor(() => {
      expect(firebaseMock.subscribeUserWorkshopSessions).toHaveBeenCalled();
    });

    const onError = firebaseMock.subscribeUserWorkshopSessions.mock.calls.at(-1)[2];

    await act(async () => {
      onError(new Error("boom"));
    });

    expect(screen.getByText(/impossible de charger les événements/i)).toBeInTheDocument();
  });
});

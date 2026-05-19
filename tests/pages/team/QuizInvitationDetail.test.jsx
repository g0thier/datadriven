import React from "react";
import { act } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

let authListener;
const { firebaseMock } = vi.hoisted(() => ({
  firebaseMock: {
    auth: { currentUser: null },
    onAuthStateChangedListener: vi.fn((cb) => {
      authListener = cb;
      return () => {};
    }),
    subscribeUserQuizInvitation: vi.fn(() => () => {}),
  },
}));

vi.mock("../../../src/firebase", () => firebaseMock);
vi.mock("../../../src/components/Navbar.jsx", () => ({ default: () => <div>NAV</div> }));
vi.mock("../../../src/components/SectionNavButtons.jsx", () => ({ default: () => <div>SECTIONS</div> }));

import QuizInvitationDetail from "../../../src/pages/team/QuizInvitationDetail.jsx";

function renderPage(route = "/team/motivation/theorie-x-y/inv-1") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="/team/motivation/:quizId/:invitationId"
          element={<QuizInvitationDetail />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("QuizInvitationDetail page", () => {
  it("renders invitation details on success", async () => {
    renderPage();

    await act(async () => {
      authListener({ uid: "u1" });
    });

    await waitFor(() => {
      expect(firebaseMock.subscribeUserQuizInvitation).toHaveBeenCalledWith(
        "u1",
        "inv-1",
        expect.any(Function),
        expect.any(Function)
      );
    });

    const onSuccess = firebaseMock.subscribeUserQuizInvitation.mock.calls.at(-1)[2];
    await act(async () => {
      onSuccess({
        invitationId: "inv-1",
        quizId: "theorie-x-y",
        quizTitle: "Théorie X-Y",
        responseDeadline: "2099-01-01T10:00:00.000Z",
        status: "invited",
      });
    });

    expect(screen.getByText(/théorie x-y/i)).toBeInTheDocument();
    expect(screen.getByText(/date limite de réponse/i)).toBeInTheDocument();
    expect(screen.getByText(/commencer le quiz/i)).toBeInTheDocument();
  });

  it("renders not found state when invitation is missing", async () => {
    renderPage();

    await act(async () => {
      authListener({ uid: "u1" });
    });

    const onSuccess = firebaseMock.subscribeUserQuizInvitation.mock.calls.at(-1)[2];
    await act(async () => {
      onSuccess(null);
    });

    expect(screen.getByText(/invitation introuvable/i)).toBeInTheDocument();
  });

  it("renders mismatch state when quizId is inconsistent", async () => {
    renderPage("/team/motivation/theorie-x-y/inv-1");

    await act(async () => {
      authListener({ uid: "u1" });
    });

    const onSuccess = firebaseMock.subscribeUserQuizInvitation.mock.calls.at(-1)[2];
    await act(async () => {
      onSuccess({
        invitationId: "inv-1",
        quizId: "autodetermination",
        quizTitle: "Autodétermination",
        responseDeadline: "2099-01-01T10:00:00.000Z",
        status: "invited",
      });
    });

    expect(screen.getByText(/lien n'est pas cohérent/i)).toBeInTheDocument();
  });

  it("renders loading error from subscription", async () => {
    renderPage();

    await act(async () => {
      authListener({ uid: "u1" });
    });

    const onError = firebaseMock.subscribeUserQuizInvitation.mock.calls.at(-1)[3];
    await act(async () => {
      onError(new Error("boom"));
    });

    expect(screen.getByText(/impossible de charger l'invitation quiz/i)).toBeInTheDocument();
  });
});

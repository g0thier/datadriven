import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

let paramsMock = { workshopId: "paper-brain", id: "s1" };
let getWorkshopSessionMock = vi.fn();
let getWorkshopMock = vi.fn();
let getWorkshopRuntimeMock = vi.fn();
let timelineState = {
  currentStep: { component: ({ sessionTitle }) => <div>STEP:{sessionTitle}</div>, audioEnabled: true },
  isFinished: false,
};

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useParams: () => paramsMock };
});

vi.mock("../../../src/firebase", () => ({
  getWorkshopSession: (...args) => getWorkshopSessionMock(...args),
}));

vi.mock("../../../src/pages/workshops/index.js", () => ({
  getWorkshop: (...args) => getWorkshopMock(...args),
  getWorkshopRuntime: (...args) => getWorkshopRuntimeMock(...args),
}));

vi.mock("../../../src/pages/workshops/useStepTimeline.js", () => ({
  useStepTimeline: () => timelineState,
}));

vi.mock("../../../src/pages/workshops/paper-brain/useCollaboration.js", () => ({
  useCollaboration: () => ({ notes: [] }),
}));

vi.mock("../../../src/pages/workshops/StepTime.jsx", () => ({ default: () => <div>STEP_TIME</div> }));
vi.mock("../../../src/pages/workshops/WorkshopWaitingPage.jsx", () => ({ default: () => <div>WAITING_PAGE</div> }));
vi.mock("../../../src/components/fallback/RouteFallback.jsx", () => ({ default: () => <div>ROUTE_FALLBACK</div> }));
vi.mock("../../../src/components/workshop-audio/WorkshopVoiceOverlay.jsx", () => ({
  default: ({ roomId }) => <div>VOICE:{roomId}</div>,
}));

import WorkshopRunner from "../../../src/pages/workshops/WorkshopRunner.jsx";

describe("WorkshopRunner", () => {
  beforeEach(() => {
    paramsMock = { workshopId: "paper-brain", id: "s1" };
    getWorkshopRuntimeMock = vi.fn().mockReturnValue({
      bridge: ({ children }) => <>{children?.({})}</>,
      summary: ({ sessionTitle }) => <div>SUMMARY:{sessionTitle}</div>,
    });
    timelineState = {
      currentStep: { component: ({ sessionTitle }) => <div>STEP:{sessionTitle}</div>, audioEnabled: true },
      isFinished: false,
    };
  });

  it("shows error when session is missing", async () => {
    getWorkshopSessionMock = vi.fn().mockResolvedValue(null);
    getWorkshopMock = vi.fn().mockReturnValue({ title: "PB", steps: [] });

    render(<WorkshopRunner />);

    await waitFor(() => {
      expect(screen.getByText(/session introuvable ou expirée/i)).toBeInTheDocument();
    });
  });

  it("shows workshop-not-found fallback when workshop data is missing", async () => {
    getWorkshopSessionMock = vi.fn().mockResolvedValue({ workshopId: "unknown", workshopDateTime: "2020-01-01T00:00:00Z" });
    getWorkshopMock = vi.fn().mockReturnValue(undefined);

    render(<WorkshopRunner />);

    await waitFor(() => {
      expect(screen.getByText(/atelier introuvable/i)).toBeInTheDocument();
    });
  });

  it("renders current step and voice overlay when session/workshop are valid", async () => {
    getWorkshopSessionMock = vi.fn().mockResolvedValue({ workshopId: "paper-brain", workshopDateTime: "2020-01-01T00:00:00Z" });
    getWorkshopMock = vi.fn().mockReturnValue({ title: "Paper Brain", steps: [{ label: "S1", duration: 5 }] });

    render(<WorkshopRunner />);

    await waitFor(() => {
      expect(screen.getByText("STEP:Paper Brain")).toBeInTheDocument();
    });

    expect(screen.getByText("STEP_TIME")).toBeInTheDocument();
    expect(screen.getByText("VOICE:s1")).toBeInTheDocument();
  });
});

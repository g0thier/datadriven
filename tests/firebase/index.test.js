import { describe, expect, it } from "vitest";
import * as firebase from "../../src/firebase/index.js";

describe("firebase/index", () => {
  it("exports known service functions", () => {
    expect(firebase).toMatchObject({
      createCompany: expect.any(Function),
      subscribeCompanyMembers: expect.any(Function),
      createWorkshopSession: expect.any(Function),
      createQuizSession: expect.any(Function),
      setWorkshopVoiceParticipant: expect.any(Function),
    });
  });
});

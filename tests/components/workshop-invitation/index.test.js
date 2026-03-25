import { describe, expect, it } from "vitest";
import * as invitationExports from "../../../src/components/workshop-invitation/index.js";

describe("components/workshop-invitation/index", () => {
  it("re-exports expected components", () => {
    expect(invitationExports).toMatchObject({
      DepartmentSelectorCard: expect.any(Function),
      MemberSelectorCard: expect.any(Function),
      SendInvitesButton: expect.any(Function),
      WorkshopDateTimeCard: expect.any(Function),
      WorkshopHeroCard: expect.any(Function),
      InvitationSummaryCard: expect.any(Function),
      InviteSendResultModal: expect.any(Function),
    });
  });
});

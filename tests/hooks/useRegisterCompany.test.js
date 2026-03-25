import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "../helpers/renderHook.js";

const navigateMock = vi.fn();
const registerCompanyAccountMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("../../src/services/registerCompanyService.js", () => ({
  registerCompanyAccount: registerCompanyAccountMock,
}));

describe("useRegisterCompany", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerCompanyAccountMock.mockResolvedValue({});
  });

  it("moves through steps and submits", async () => {
    const { default: useRegisterCompany } = await import("../../src/hooks/useRegisterCompany.js");
    const hook = await renderHook(() => useRegisterCompany());

    expect(hook.result.step).toBe(1);
    expect(hook.result.canGoNext).toBe(false);

    await act(async () => {
      hook.result.updateField("companyName", "ACME");
    });

    expect(hook.result.canGoNext).toBe(true);

    const submitEvent = { preventDefault: vi.fn() };

    await act(async () => {
      await hook.result.handleSubmit(submitEvent);
    });

    expect(hook.result.step).toBe(2);

    await act(async () => {
      hook.result.updateField("companyAddress", "Rue 1");
      hook.result.updateField("companyCity", "Lausanne");
      hook.result.updateField("companyZip", "1000");
      hook.result.updateField("companyCountry", "Suisse");
    });
    await act(async () => {
      await hook.result.handleSubmit(submitEvent);
    });
    await act(async () => {
      hook.result.updateField("adminFirstName", "Ada");
      hook.result.updateField("adminLastName", "Lovelace");
      hook.result.updateField("adminEmail", "ada@example.com");
    });
    await act(async () => {
      await hook.result.handleSubmit(submitEvent);
    });
    await act(async () => {
      hook.result.updateField("password", "12345678");
      hook.result.updateField("passwordConfirm", "12345678");
      hook.result.updateField("acceptTerms", true);
    });
    await act(async () => {
      await hook.result.handleSubmit(submitEvent);
    });

    expect(hook.result.step).toBe(5);

    await act(async () => {
      await hook.result.handleSubmit(submitEvent);
    });

    expect(registerCompanyAccountMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/innovation");

    await hook.unmount();
  });

  it("sets submit error when service fails", async () => {
    registerCompanyAccountMock.mockRejectedValue(new Error("boom"));
    const { default: useRegisterCompany } = await import("../../src/hooks/useRegisterCompany.js");
    const hook = await renderHook(() => useRegisterCompany());

    const event = { preventDefault: vi.fn() };

    await act(async () => {
      hook.result.updateField("companyName", "ACME");
    });
    await act(async () => {
      await hook.result.handleSubmit(event);
    });
    await act(async () => {
      hook.result.updateField("companyAddress", "Rue 1");
      hook.result.updateField("companyCity", "Lausanne");
      hook.result.updateField("companyZip", "1000");
      hook.result.updateField("companyCountry", "Suisse");
    });
    await act(async () => {
      await hook.result.handleSubmit(event);
    });
    await act(async () => {
      hook.result.updateField("adminFirstName", "Ada");
      hook.result.updateField("adminLastName", "Lovelace");
      hook.result.updateField("adminEmail", "ada@example.com");
    });
    await act(async () => {
      await hook.result.handleSubmit(event);
    });
    await act(async () => {
      hook.result.updateField("password", "12345678");
      hook.result.updateField("passwordConfirm", "12345678");
      hook.result.updateField("acceptTerms", true);
    });
    await act(async () => {
      await hook.result.handleSubmit(event);
    });
    await act(async () => {
      await hook.result.handleSubmit(event);
    });

    expect(hook.result.submitError).toBe("boom");
    await hook.unmount();
  });
});

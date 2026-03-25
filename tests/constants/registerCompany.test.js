import { describe, expect, it } from "vitest";
import {
  REGISTER_COMPANY_INITIAL_FORM,
  REGISTER_COMPANY_STEP_CONTENT,
} from "../../src/constants/registerCompany.js";
import DEFAULT_DEPARTMENTS from "../../src/constants/defaults.js";

describe("constants/registerCompany", () => {
  it("contains 5 registration steps", () => {
    expect(Object.keys(REGISTER_COMPANY_STEP_CONTENT)).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("contains initial form defaults", () => {
    expect(REGISTER_COMPANY_INITIAL_FORM.companyCountry).toBe("Suisse");
    expect(REGISTER_COMPANY_INITIAL_FORM.acceptTerms).toBe(false);
  });

  it("contains default departments", () => {
    expect(DEFAULT_DEPARTMENTS.length).toBeGreaterThan(5);
  });
});

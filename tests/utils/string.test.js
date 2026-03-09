import { expect, test } from "vitest";
import slugify from "../../src/utils/string";

test("slugify should convert a string to a slug", () => {
  expect(slugify("Hello World")).toBe("hello-world");
  expect(slugify("This is a Test")).toBe("this-is-a-test");
  expect(slugify("  Leading and Trailing Spaces  ")).toBe("leading-and-trailing-spaces");
  expect(slugify("Special Characters!@#$%^&*()")).toBe("special-characters");
  expect(slugify("Multiple   Spaces")).toBe("multiple-spaces");
  expect(slugify("Already-a-slug")).toBe("already-a-slug");
  expect(slugify("This & That")).toBe("this-that");
  expect(slugify("To be 3")).toBe("to-be-3");
});
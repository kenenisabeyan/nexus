import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// @testing-library/react does not automatically unmount components between
// tests under Vitest (unlike Jest, where this happens implicitly). Its
// absence was found as a real bug the first time this test suite was
// built — it caused genuine "multiple elements found" failures by leaving
// earlier tests' rendered DOM in place for later tests in the same file to
// collide with. Included correctly from the start here.
afterEach(() => {
  cleanup();
});

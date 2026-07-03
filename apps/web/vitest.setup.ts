import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Explicit cleanup so we don't depend on Vitest global injection.
afterEach(() => cleanup());

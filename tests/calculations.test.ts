import { describe, it, expect } from "vitest";
import { getPhase } from "../src/lib/calculations";

describe("getPhase", () => {
	it("returns D0-7 for days 0-7", () => {
		expect(getPhase(0)).toBe("D0-7");
		expect(getPhase(7)).toBe("D0-7");
	});
	it("returns D8-21 for days 8-21", () => {
		expect(getPhase(8)).toBe("D8-21");
		expect(getPhase(21)).toBe("D8-21");
	});
	it("returns D22-45 for days 22-45", () => {
		expect(getPhase(22)).toBe("D22-45");
		expect(getPhase(33)).toBe("D22-45");
		expect(getPhase(45)).toBe("D22-45");
	});
	it("returns D46-90 for days 46-90", () => {
		expect(getPhase(46)).toBe("D46-90");
		expect(getPhase(90)).toBe("D46-90");
	});
	it("returns D91-180 for days 91+", () => {
		expect(getPhase(91)).toBe("D91-180");
		expect(getPhase(200)).toBe("D91-180");
	});
	it("handles negative days as pre-launch", () => {
		expect(getPhase(-1)).toBe("pre-launch");
	});
});

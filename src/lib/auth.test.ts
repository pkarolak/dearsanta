import { describe, expect, it } from "vitest";
import { hostSeatPlan } from "./auth";

describe("hostSeatPlan", () => {
  it("keeps the host seat when a guest link is opened in the host's browser", () => {
    expect(hostSeatPlan({ nextIsHost: false, alreadyParked: false, currentIsHost: true, emailIsHost: true })).toBe("park-current");
    expect(hostSeatPlan({ nextIsHost: false, alreadyParked: false, currentIsHost: false, emailIsHost: true })).toBe("park-email");
  });

  it("does not replace a host seat that is already parked", () => {
    expect(hostSeatPlan({ nextIsHost: false, alreadyParked: true, currentIsHost: false, emailIsHost: false })).toBe("keep");
  });

  it("writes the host cookie when the host signs in", () => {
    expect(hostSeatPlan({ nextIsHost: true, alreadyParked: false, currentIsHost: false, emailIsHost: false })).toBe("replace-with-host");
  });

  it("leaves a normal guest sign-in alone", () => {
    expect(hostSeatPlan({ nextIsHost: false, alreadyParked: false, currentIsHost: false, emailIsHost: false })).toBe("guest-only");
  });
});

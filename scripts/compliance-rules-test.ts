import { evaluateEligibilityWithRules, type EligibilityRule } from "../lib/eligibility/rules";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const rules: EligibilityRule[] = [
  { state: "TX", category: "STUN_GUN", outcome: "ALLOW", coverage: "covered" },
  { state: "HI", category: "STUN_GUN", outcome: "BLOCK", coverage: "covered" },
];

const tx = evaluateEligibilityWithRules({ restricted: true, restrictedClass: "STUN_GUN", state: "TX", isAtLeast18: true }, rules);
assert(tx.status === "available", `Expected STUN_GUN + TX to be allowed, got ${tx.status}`);

const hi = evaluateEligibilityWithRules({ restricted: true, restrictedClass: "STUN_GUN", state: "HI", isAtLeast18: true }, rules);
assert(hi.status === "blocked", `Expected STUN_GUN + HI to be blocked, got ${hi.status}`);

const missingClass = evaluateEligibilityWithRules({ restricted: true, state: "TX", isAtLeast18: true }, rules);
assert(missingClass.status === "blocked", `Expected restricted missing restrictedClass to fail closed, got ${missingClass.status}`);

console.log("Compliance restrictedClass tests passed.");

// Pure-function tests for the booking state machine.
// Run with `npm test` in services/core (uses Node's built-in test runner).

const test = require("node:test");
const assert = require("node:assert/strict");
const { canTransition } = require("../stateMachine");

test("admin can approve a requested booking", () => {
  const r = canTransition("requested", "approved", { role: "admin", isOwner: false });
  assert.equal(r.ok, true);
});

test("supervisor can approve a requested booking", () => {
  const r = canTransition("requested", "approved", { role: "supervisor", isOwner: false });
  assert.equal(r.ok, true);
});

test("student cannot approve a booking", () => {
  const r = canTransition("requested", "approved", { role: "student", isOwner: false });
  assert.equal(r.ok, false);
});

test("requester can cancel their own pending booking", () => {
  const r = canTransition("requested", "cancelled", { role: "student", isOwner: true });
  assert.equal(r.ok, true);
});

test("non-owner student cannot cancel another booking", () => {
  const r = canTransition("requested", "cancelled", { role: "student", isOwner: false });
  assert.equal(r.ok, false);
});

test("cannot transition from rejected", () => {
  const r = canTransition("rejected", "approved", { role: "admin", isOwner: false });
  assert.equal(r.ok, false);
});

test("returned is terminal", () => {
  const r = canTransition("returned", "in_use", { role: "admin", isOwner: false });
  assert.equal(r.ok, false);
});

test("approved booking can move to in_use by admin", () => {
  const r = canTransition("approved", "in_use", { role: "admin", isOwner: false });
  assert.equal(r.ok, true);
});

test("in_use booking can be returned", () => {
  const r = canTransition("in_use", "returned", { role: "admin", isOwner: false });
  assert.equal(r.ok, true);
});

test("rejection requires explicit role (admin/supervisor)", () => {
  const r = canTransition("requested", "rejected", { role: "student", isOwner: true });
  assert.equal(r.ok, false);
});

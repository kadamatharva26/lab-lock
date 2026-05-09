/**
 * Booking state machine.
 *
 *   requested ──▶ approved ──▶ in_use ──▶ returned
 *      │             │
 *      │             └──▶ rejected
 *      │
 *      ├──▶ cancelled (by requester before approval)
 *      └──▶ rejected  (by admin/supervisor)
 */

const TRANSITIONS = {
  requested: {
    approved: ["admin", "supervisor"],
    rejected: ["admin", "supervisor"],
    cancelled: ["self"],
  },
  approved: {
    in_use: ["admin", "supervisor"],
    cancelled: ["admin", "self"],
  },
  in_use: {
    returned: ["admin", "supervisor"],
  },
  rejected: {},
  returned: {},
  cancelled: {},
};

/**
 * @param {string} from current status
 * @param {string} to target status
 * @param {object} actor { role: 'student'|'supervisor'|'admin', isOwner: boolean }
 * @returns {{ ok: boolean, reason?: string, allowed?: string[] }}
 */
function canTransition(from, to, actor) {
  const allowedToStatuses = TRANSITIONS[from] || {};
  const allowedActors = allowedToStatuses[to];
  if (!allowedActors) {
    return {
      ok: false,
      reason: `Cannot transition from "${from}" to "${to}"`,
      allowed: Object.keys(allowedToStatuses),
    };
  }
  // "self" means the requester themselves (only for cancellation)
  const actorMatches =
    allowedActors.includes(actor.role) || (allowedActors.includes("self") && actor.isOwner);
  if (!actorMatches) {
    return {
      ok: false,
      reason: `Role "${actor.role}" cannot perform this transition`,
      allowed: allowedActors,
    };
  }
  return { ok: true };
}

module.exports = { canTransition, TRANSITIONS };

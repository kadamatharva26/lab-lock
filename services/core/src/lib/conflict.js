/**
 * Three-way conflict detection.
 *
 * Returns an array of conflict objects. Empty array = OK to book.
 * Each conflict object has shape:
 *   { type: 'equipment' | 'supervisor' | 'supervisor_unavailable', conflictWith?: <bookingId|date> }
 *
 * NOTE: Uses half-open intervals [start, end). Back-to-back slots do not conflict.
 */

const ACTIVE_STATUSES = ["requested", "approved", "in_use"];

/**
 * @param {object} prisma  Prisma client
 * @param {object} args
 * @param {string} args.equipmentId
 * @param {Date}   args.startTime
 * @param {Date}   args.endTime
 * @param {string=} args.excludeBookingId  ignore this booking id (for updates)
 * @returns {Promise<Array>} conflicts
 */
async function findConflicts(prisma, { equipmentId, startTime, endTime, excludeBookingId }) {
  const conflicts = [];

  // 1. Equipment self-conflict
  const equipmentConflict = await prisma.booking.findFirst({
    where: {
      equipmentId,
      status: { in: ACTIVE_STATUSES },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      ...(excludeBookingId ? { NOT: { id: excludeBookingId } } : {}),
    },
    select: { id: true, startTime: true, endTime: true, status: true },
  });
  if (equipmentConflict) {
    conflicts.push({
      type: "equipment",
      message: "Equipment already booked in that window",
      conflictWith: equipmentConflict,
    });
  }

  // Look up supervisor for this equipment
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: { supervisorId: true, isActive: true },
  });
  if (!equipment || !equipment.isActive) {
    conflicts.push({
      type: "equipment_inactive",
      message: "Equipment does not exist or is inactive",
    });
    return conflicts;
  }

  if (equipment.supervisorId) {
    // 2. Supervisor double-booked across other equipment
    const supervisorConflict = await prisma.booking.findFirst({
      where: {
        equipment: { supervisorId: equipment.supervisorId },
        status: { in: ACTIVE_STATUSES },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        ...(excludeBookingId ? { NOT: { id: excludeBookingId } } : {}),
      },
      select: { id: true, startTime: true, endTime: true, equipmentId: true },
    });
    if (supervisorConflict) {
      conflicts.push({
        type: "supervisor",
        message: "Supervising faculty already busy in that window",
        conflictWith: supervisorConflict,
      });
    }

    // 3. Supervisor explicitly unavailable that day
    const dayStart = new Date(startTime);
    dayStart.setUTCHours(0, 0, 0, 0);
    const unavailability = await prisma.supervisorAvailability.findFirst({
      where: {
        supervisorId: equipment.supervisorId,
        day: dayStart,
        isAvailable: false,
      },
    });
    if (unavailability) {
      conflicts.push({
        type: "supervisor_unavailable",
        message: "Supervising faculty is unavailable that day",
        conflictWith: { day: unavailability.day, reason: unavailability.reason },
      });
    }
  }

  return conflicts;
}

module.exports = { findConflicts, ACTIVE_STATUSES };

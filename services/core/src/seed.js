// Seed script — populates the DB with realistic data graders can interact with.
// Run with: npm --workspace services/core run db:seed

require("dotenv").config();
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding LabLock…");

  // --- 1. Users ---
  const hash = await bcrypt.hash("password123", 10);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@lablock.local" },
    update: {},
    create: {
      email: "admin@lablock.local",
      passwordHash: hash,
      name: "Admin User",
      role: "admin",
    },
  });

  // Supervisors
  const supervisors = [];
  const supervisorNames = [
    "Prof. Asha Rao",
    "Prof. Vivek Mehta",
    "Prof. Lalita Nair",
    "Prof. Hari Iyer",
    "Prof. Sara Khan",
  ];
  for (const name of supervisorNames) {
    const email = name.toLowerCase().replace(/[^a-z]/g, "") + "@lablock.local";
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash: hash, name, role: "supervisor" },
    });
    supervisors.push(u);
  }

  // Students
  const students = [];
  const studentFirstNames = [
    "Aditi", "Karan", "Riya", "Ankit", "Priya", "Rohan", "Sneha", "Aman",
    "Tara", "Yash", "Nisha", "Vikram", "Pooja", "Devdutt", "Ira",
    "Naveen", "Mira", "Arjun", "Kavya", "Siddharth",
  ];
  for (const fn of studentFirstNames) {
    const email = fn.toLowerCase() + "@student.lablock.local";
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash: hash, name: fn + " S.", role: "student" },
    });
    students.push(u);
  }

  // --- 2. Lab rooms ---
  const labs = await Promise.all(
    [
      { name: "EEE Lab 1", capacity: 24, building: "Block A" },
      { name: "Mech Lab 2", capacity: 18, building: "Block B" },
      { name: "Chem Lab 1", capacity: 20, building: "Block C" },
    ].map((d) =>
      prisma.labRoom.upsert({ where: { name: d.name }, update: {}, create: d })
    )
  );

  // --- 3. Equipment ---
  const equipmentDefs = [
    { name: "Tektronix Oscilloscope #A-12", category: "oscilloscope", labRoom: labs[0], supervisor: supervisors[0] },
    { name: "Tektronix Oscilloscope #A-13", category: "oscilloscope", labRoom: labs[0], supervisor: supervisors[0] },
    { name: "Function Generator #FG-04",   category: "function_generator", labRoom: labs[0], supervisor: supervisors[0] },
    { name: "Spectrum Analyzer #SA-02",    category: "spectrum_analyzer", labRoom: labs[0], supervisor: supervisors[1] },
    { name: "Soldering Station #SS-08",    category: "soldering_station", labRoom: labs[0], supervisor: null },

    { name: "Prusa MK4 3D Printer",        category: "3d_printer", labRoom: labs[1], supervisor: supervisors[2] },
    { name: "Bambu X1C 3D Printer",        category: "3d_printer", labRoom: labs[1], supervisor: supervisors[2] },
    { name: "Laser Cutter #LC-01",         category: "laser_cutter", labRoom: labs[1], supervisor: supervisors[2] },
    { name: "CNC Mill #CM-02",             category: "cnc_mill", labRoom: labs[1], supervisor: supervisors[3] },
    { name: "Vernier Caliper Set",         category: "measurement", labRoom: labs[1], supervisor: null },

    { name: "UV-Vis Spectrometer",         category: "spectrometer", labRoom: labs[2], supervisor: supervisors[4] },
    { name: "Centrifuge #CF-03",           category: "centrifuge", labRoom: labs[2], supervisor: supervisors[4] },
    { name: "Fume Hood Slot A",            category: "fume_hood", labRoom: labs[2], supervisor: supervisors[4] },
    { name: "Analytical Balance",          category: "balance", labRoom: labs[2], supervisor: null },
    { name: "pH Meter #PH-07",             category: "ph_meter", labRoom: labs[2], supervisor: null },
  ];

  const equipmentList = [];
  for (const def of equipmentDefs) {
    const existing = await prisma.equipment.findFirst({ where: { name: def.name } });
    if (existing) {
      equipmentList.push(existing);
      continue;
    }
    const created = await prisma.equipment.create({
      data: {
        name: def.name,
        category: def.category,
        condition: "good",
        quantity: 1,
        labRoomId: def.labRoom.id,
        supervisorId: def.supervisor?.id ?? null,
      },
    });
    equipmentList.push(created);
  }

  // --- 4. Bookings (mix of past + upcoming, varied statuses) ---
  // Wipe demo bookings first to keep seed idempotent
  await prisma.bookingStatusHistory.deleteMany({});
  await prisma.booking.deleteMany({});

  const now = new Date();
  const slot = (daysOffset, startHour, durationHours) => {
    const start = new Date(now);
    start.setDate(now.getDate() + daysOffset);
    start.setHours(startHour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + durationHours);
    return [start, end];
  };

  const bookingDefs = [
    // past — returned
    { eq: equipmentList[0], student: students[0], offset: -7, hour: 10, dur: 2, status: "returned" },
    { eq: equipmentList[1], student: students[1], offset: -6, hour: 14, dur: 1, status: "returned" },
    { eq: equipmentList[5], student: students[2], offset: -5, hour: 9,  dur: 3, status: "returned" },
    { eq: equipmentList[10], student: students[3], offset: -4, hour: 11, dur: 1, status: "returned" },
    { eq: equipmentList[7], student: students[4], offset: -3, hour: 13, dur: 2, status: "returned" },
    { eq: equipmentList[2], student: students[5], offset: -2, hour: 10, dur: 1, status: "returned" },
    // past — rejected
    { eq: equipmentList[3], student: students[6], offset: -3, hour: 9,  dur: 2, status: "rejected", rejectReason: "Equipment under service" },
    // upcoming — approved
    { eq: equipmentList[0], student: students[7], offset: 1,  hour: 10, dur: 2, status: "approved" },
    { eq: equipmentList[5], student: students[8], offset: 1,  hour: 14, dur: 2, status: "approved" },
    { eq: equipmentList[6], student: students[9], offset: 2,  hour: 9,  dur: 3, status: "approved" },
    { eq: equipmentList[10], student: students[10], offset: 2,  hour: 13, dur: 1, status: "approved" },
    // today — in_use
    { eq: equipmentList[1], student: students[11], offset: 0,  hour: Math.max(1, now.getHours() - 1), dur: 2, status: "in_use" },
    // upcoming — pending approvals
    { eq: equipmentList[3], student: students[12], offset: 3,  hour: 10, dur: 1, status: "requested" },
    { eq: equipmentList[7], student: students[13], offset: 3,  hour: 14, dur: 2, status: "requested" },
    { eq: equipmentList[8], student: students[14], offset: 4,  hour: 9,  dur: 3, status: "requested" },
    { eq: equipmentList[11], student: students[15], offset: 4,  hour: 13, dur: 1, status: "requested" },
    { eq: equipmentList[2], student: students[16], offset: 5,  hour: 10, dur: 1, status: "requested" },
  ];

  for (const def of bookingDefs) {
    const [startTime, endTime] = slot(def.offset, def.hour, def.dur);
    const b = await prisma.booking.create({
      data: {
        equipmentId: def.eq.id,
        requesterId: def.student.id,
        startTime,
        endTime,
        purpose: "Coursework lab session",
        status: def.status,
        rejectReason: def.rejectReason || null,
      },
    });
    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: b.id,
        actorId: def.student.id,
        fromStatus: null,
        toStatus: "requested",
        note: "Booking submitted",
      },
    });
    if (def.status !== "requested") {
      await prisma.bookingStatusHistory.create({
        data: {
          bookingId: b.id,
          actorId: admin.id,
          fromStatus: "requested",
          toStatus: def.status,
          note: def.rejectReason || "demo seed transition",
        },
      });
    }
  }

  console.log(`Seed complete:
  - 1 admin (admin@lablock.local / password123)
  - ${supervisors.length} supervisors
  - ${students.length} students
  - ${labs.length} lab rooms
  - ${equipmentList.length} equipment items
  - ${bookingDefs.length} bookings`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

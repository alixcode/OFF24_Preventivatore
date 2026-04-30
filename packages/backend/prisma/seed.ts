import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Officina24 — azienda pilota
  const company = await prisma.company.upsert({
    where: { id: "company-officina24" },
    update: {},
    create: {
      id: "company-officina24",
      name: "Officina24 Srl",
      vatNumber: "IT12345678901",
      email: "info@officina24srl.eu",
      overheadRate: 0.18,
      marginMinimum: 0.20,
      marginTarget: 0.30,
    },
  });

  // Utente admin
  const passwordHash = await bcrypt.hash("password123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "alice.brocca@axeleragovernance.com" },
    update: {},
    create: {
      companyId: company.id,
      email: "alice.brocca@axeleragovernance.com",
      passwordHash,
      name: "Alice Brocca",
      role: UserRole.admin,
    },
  });

  // Clienti di esempio
  const clientRossi = await prisma.client.upsert({
    where: { id: "client-rossi" },
    update: {},
    create: {
      id: "client-rossi",
      companyId: company.id,
      name: "Costruzioni Rossi",
      email: "info@costruzionirossi.it",
      phone: "02-12345678",
      isNew: false,
    },
  });

  const clientVerdi = await prisma.client.upsert({
    where: { id: "client-verdi" },
    update: {},
    create: {
      id: "client-verdi",
      companyId: company.id,
      name: "Logistica Verdi SpA",
      email: "acquisti@logisticaverdi.it",
      isNew: false,
    },
  });

  // Materiali base
  const materialsData = [
    { code: "MAT-001", name: "Tubo quadro 40×40×3 Fe", category: "ferro", unit: "ml", currentPrice: 4.20 },
    { code: "MAT-002", name: "Lamiera 3mm Fe", category: "ferro", unit: "kg", currentPrice: 1.85 },
    { code: "MAT-003", name: "Ferro tondo Ø16", category: "ferro", unit: "ml", currentPrice: 2.10 },
    { code: "MAT-004", name: "Tubo tondo Ø40×2 Fe", category: "ferro", unit: "ml", currentPrice: 3.60 },
    { code: "MAT-005", name: "Angolare 40×40×4 Fe", category: "ferro", unit: "ml", currentPrice: 3.90 },
    { code: "MAT-006", name: "Acciaio inox 304 lamiera 2mm", category: "inox", unit: "kg", currentPrice: 5.80 },
    { code: "MAT-007", name: "Tubo quadro inox 40×40×2", category: "inox", unit: "ml", currentPrice: 8.50 },
    { code: "MAT-008", name: "Piastrina 100×100×8 Fe", category: "ferro", unit: "pz", currentPrice: 1.40 },
  ];

  for (const mat of materialsData) {
    await prisma.material.upsert({
      where: { companyId_code: { companyId: company.id, code: mat.code } },
      update: { currentPrice: mat.currentPrice },
      create: { companyId: company.id, ...mat },
    });
  }

  // Lavorazioni standard
  const operationsData = [
    { code: "OP-TAGLIO", name: "Taglio plasma", defaultHourlyRate: 35 },
    { code: "OP-SALD-MIG", name: "Saldatura MIG", defaultHourlyRate: 38 },
    { code: "OP-SALD-TIG", name: "Saldatura TIG", defaultHourlyRate: 42 },
    { code: "OP-PIEGA", name: "Piega CNC", defaultHourlyRate: 40 },
    { code: "OP-FORATURA", name: "Foratura", defaultHourlyRate: 30 },
    { code: "OP-MOLATURA", name: "Molatura e finitura", defaultHourlyRate: 32 },
    { code: "OP-VERN", name: "Verniciatura", defaultHourlyRate: 30 },
    { code: "OP-POSA", name: "Posa in opera", defaultHourlyRate: 40 },
  ];

  for (const op of operationsData) {
    await prisma.operation.upsert({
      where: { id: `op-${op.code.toLowerCase()}` },
      update: {},
      create: { id: `op-${op.code.toLowerCase()}`, companyId: company.id, ...op },
    });
  }

  console.log("✓ Seed completato — Officina24 pronta");
  console.log(`  Company ID: ${company.id}`);
  console.log(`  Admin: ${admin.email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

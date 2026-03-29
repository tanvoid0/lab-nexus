import { hash } from "bcryptjs";
import {
  AssetCondition,
  AssetOperationalStatus,
  PrismaClient,
} from "@prisma/client";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_PASSWORD_PLAINTEXT,
  DEMO_STAFF_EMAIL,
  DEMO_STUDENT_EMAIL,
} from "../lib/dev/demo-auth";

const prisma = new PrismaClient();

function assertSeedAllowed() {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "Refusing to seed: NODE_ENV=production. Demo data and known passwords must not be applied to production databases.",
    );
    process.exit(1);
  }
  if (process.env.VERCEL_ENV === "production") {
    console.error("Refusing to seed: VERCEL_ENV=production.");
    process.exit(1);
  }
}

async function ensureUser(data: {
  email: string;
  passwordHash: string;
  name: string;
  roles: string[];
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return existing;
  return prisma.user.create({ data });
}

async function ensureCategory(name: string) {
  const existing = await prisma.assetCategory.findUnique({ where: { name } });
  if (existing) return existing;
  return prisma.assetCategory.create({ data: { name } });
}

async function ensureLocation(name: string) {
  const existing = await prisma.location.findUnique({ where: { name } });
  if (existing) return existing;
  return prisma.location.create({ data: { name } });
}

async function ensureProject(name: string, slug: string) {
  const existing = await prisma.project.findFirst({
    where: { OR: [{ slug }, { name }] },
  });
  if (existing) return existing;
  return prisma.project.create({ data: { name, slug } });
}

async function ensureAsset(data: Parameters<typeof prisma.asset.create>[0]["data"]) {
  const existing = await prisma.asset.findUnique({
    where: { skuOrInternalId: data.skuOrInternalId },
  });
  if (existing) return existing;
  return prisma.asset.create({ data });
}

async function main() {
  assertSeedAllowed();

  const password = await hash(DEMO_PASSWORD_PLAINTEXT, 12);

  const admin = await ensureUser({
    email: DEMO_ADMIN_EMAIL,
    passwordHash: password,
    name: "Lab Admin",
    roles: ["ADMIN"],
  });

  await ensureUser({
    email: DEMO_STAFF_EMAIL,
    passwordHash: password,
    name: "Researcher",
    roles: ["RESEARCHER"],
  });

  await ensureUser({
    email: DEMO_STUDENT_EMAIL,
    passwordHash: password,
    name: "Student",
    roles: ["STUDENT"],
  });

  const catRobotics = await ensureCategory("Robotics");
  const catNetwork = await ensureCategory("Networking");
  const loc314 = await ensureLocation("Room 314");

  const projectAd = await ensureProject("Autonomous driving", "autonomous-driving");

  const researcherUser = await prisma.user.findUnique({
    where: { email: DEMO_STAFF_EMAIL },
  });
  if (researcherUser) {
    const existingMember = await prisma.projectMember.findFirst({
      where: { projectId: projectAd.id, userId: researcherUser.id },
    });
    if (!existingMember) {
      await prisma.projectMember.create({
        data: { projectId: projectAd.id, userId: researcherUser.id },
      });
    }
  }

  await ensureAsset({
    skuOrInternalId: "DEMO-ROBOT-01",
    name: "ROSMASTER X3 (demo)",
    condition: AssetCondition.WORKING,
    operationalStatus: AssetOperationalStatus.AVAILABLE,
    quantityTotal: 1,
    quantityAvailable: 1,
    notes: "Seeded demo asset",
    categoryId: catRobotics.id,
    locationId: loc314.id,
    custodianUserId: admin.id,
    trackTag: "TAG-DEMO-ROBOT-01",
    acquiredAt: new Date(),
  });

  const modemAsset = await ensureAsset({
    skuOrInternalId: "DEMO-5G-01",
    name: "Quectel RM520N-GL module (demo)",
    condition: AssetCondition.WORKING,
    operationalStatus: AssetOperationalStatus.AVAILABLE,
    quantityTotal: 2,
    quantityAvailable: 2,
    categoryId: catNetwork.id,
    locationId: loc314.id,
    trackTag: "TAG-DEMO-5G",
  });

  const unitCount = await prisma.assetUnit.count({
    where: { assetId: modemAsset.id },
  });
  if (unitCount === 0) {
    await prisma.assetUnit.createMany({
      data: [
        { assetId: modemAsset.id, serialNumber: "5G-SN-DEMO-A" },
        { assetId: modemAsset.id, serialNumber: "5G-SN-DEMO-B" },
      ],
    });
  }

  console.log(
    `Seed OK. Dev quick login or manual sign-in: ${DEMO_ADMIN_EMAIL}, ${DEMO_STAFF_EMAIL}, ${DEMO_STUDENT_EMAIL} (password in lib/dev/demo-auth.ts — dev only).`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

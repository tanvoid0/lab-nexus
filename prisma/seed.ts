import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import {
  AuditAction,
  AuditEntityType,
  CheckoutRequestLineStatus,
  CheckoutRequestStatus,
  CheckoutStatus,
  PrismaClient,
} from "@prisma/client";
import { DEFAULT_LOOKUP_ROWS } from "../lib/reference/lookup-defaults";
import { ensureDefaultLookupEntries } from "../lib/reference/ensure-lookups";
import { prepareDemoPasswordForSeed, seedDemoCredentialsPath } from "../lib/dev/demo-credentials";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_STAFF_EMAIL,
  DEMO_STUDENT_EMAIL,
} from "../lib/dev/demo-auth";
import { syncInventorySeedItemsValidated } from "../lib/inventory/sync-seed-items";
import { loadInventorySeedFile } from "./inventory-seed";
import { LAB_CURRENCY_CONFIG_ID } from "../lib/currency/constants";
import { getBootstrapFunctionalCurrencyCode } from "../lib/currency/bootstrap";
import { LAB_ROLE } from "../lib/auth/roles";
import { notDeleted } from "../lib/prisma/active-scopes";

const prisma = new PrismaClient();

const SEED_PURPOSE_ACTIVE_MODEM = "[seed] Active modem loan";
const SEED_PURPOSE_RETURNED_ROBOT = "[seed] Robot loan (returned)";
const SEED_PURPOSE_OVERDUE_LIDAR = "[seed] LiDAR loan (overdue)";
const SEED_PURPOSE_PENDING_REQUEST = "[seed] Pending loan approval (synthetic SKU)";

const MODEM_SEED_NOTES = "Two serialized units for checkout / unit-tag demos.";

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

const userSeedSelect = {
  id: true,
  email: true,
  passwordHash: true,
  name: true,
  roles: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function ensureUser(data: {
  email: string;
  passwordHash: string;
  name: string;
  roles: string[];
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: userSeedSelect,
  });
  if (existing) {
    if (existing.deletedAt) {
      return prisma.user.update({
        where: { id: existing.id },
        data: {
          deletedAt: null,
          passwordHash: data.passwordHash,
          name: data.name,
          roles: data.roles,
        },
      });
    }
    return existing;
  }
  return prisma.user.create({ data });
}

/** Ensures UserSettings exists after the model is added (re-seed / db push). Safe if Prisma client is stale. */
async function ensureUserSettingsRow(userId: string) {
  type Delegate = {
    upsert: (args: {
      where: { userId: string };
      create: { userId: string; theme: string; density: string };
      update: Record<string, never>;
    }) => Promise<unknown>;
  };
  const delegate = (prisma as unknown as { userSettings?: Delegate }).userSettings;
  if (!delegate?.upsert) {
    console.warn(
      "Seed: skip UserSettings rows — run `pnpm db:generate` so prisma.userSettings exists, then re-run seed.",
    );
    return;
  }
  await delegate.upsert({
    where: { userId },
    create: { userId, theme: "light", density: "comfortable" },
    update: {},
  });
}

async function ensureCategory(name: string) {
  const existing = await prisma.assetCategory.findFirst({
    where: { name, ...notDeleted },
  });
  if (existing) return existing;
  return prisma.assetCategory.create({ data: { name } });
}

async function ensureLocation(name: string) {
  const existing = await prisma.location.findFirst({
    where: { name, ...notDeleted },
  });
  if (existing) return existing;
  return prisma.location.create({ data: { name } });
}

async function ensureProject(name: string, slug: string) {
  const existing = await prisma.project.findFirst({
    where: {
      AND: [{ ...notDeleted }, { OR: [{ slug }, { name }] }],
    },
  });
  if (existing) return existing;
  return prisma.project.create({ data: { name, slug } });
}

async function ensureProjectMember(projectId: string, userId: string) {
  const existing = await prisma.projectMember.findFirst({
    where: { projectId, userId },
  });
  if (existing) return;
  await prisma.projectMember.create({ data: { projectId, userId } });
}

/** Singleton lab currency row; `update: {}` preserves admin edits on re-seed. */
async function ensureLabCurrencyConfigRow() {
  type Delegate = {
    upsert: (args: {
      where: { id: string };
      create: { id: string; functionalCurrencyCode: string; additionalTransactionCodes: string[] };
      update: Record<string, never>;
    }) => Promise<unknown>;
  };
  const delegate = (prisma as unknown as { labCurrencyConfig?: Delegate }).labCurrencyConfig;
  if (!delegate?.upsert) {
    console.warn(
      "Seed: skip LabCurrencyConfig — run `pnpm db:generate` and `pnpm db:push` if the model is new, then re-run seed.",
    );
    return;
  }
  await delegate.upsert({
    where: { id: LAB_CURRENCY_CONFIG_ID },
    create: {
      id: LAB_CURRENCY_CONFIG_ID,
      functionalCurrencyCode: getBootstrapFunctionalCurrencyCode(),
      additionalTransactionCodes: [],
    },
    update: {},
  });
}

async function ensureAsset(data: Parameters<typeof prisma.asset.create>[0]["data"]) {
  const existing = await prisma.asset.findFirst({
    where: { skuOrInternalId: data.skuOrInternalId, ...notDeleted },
  });
  if (existing) return existing;
  return prisma.asset.create({ data });
}

/** Keeps demo SKUs aligned with reference lookups (safe on re-seed / after manual edits). */
async function normalizeDemoAssetLookupCodes() {
  const patches: {
    skuOrInternalId: string;
    conditionCode: string;
    operationalStatusCode: string;
  }[] = [
    {
      skuOrInternalId: "DEMO-ROBOT-01",
      conditionCode: "WORKING",
      operationalStatusCode: "AVAILABLE",
    },
    {
      skuOrInternalId: "DEMO-5G-01",
      conditionCode: "WORKING",
      operationalStatusCode: "AVAILABLE",
    },
    {
      skuOrInternalId: "DEMO-LIDAR-01",
      conditionCode: "WORKING",
      operationalStatusCode: "MAINTENANCE",
    },
  ];
  for (const p of patches) {
    await prisma.asset.updateMany({
      where: { skuOrInternalId: p.skuOrInternalId, ...notDeleted },
      data: {
        conditionCode: p.conditionCode,
        operationalStatusCode: p.operationalStatusCode,
      },
    });
  }
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000);
}

async function main() {
  assertSeedAllowed();

  await ensureDefaultLookupEntries(prisma);
  await ensureLabCurrencyConfigRow();
  const lookupCount = await prisma.lookupEntry.count({ where: { ...notDeleted } });
  if (lookupCount < DEFAULT_LOOKUP_ROWS.length) {
    console.warn(
      `Seed: expected at least ${DEFAULT_LOOKUP_ROWS.length} lookup rows, found ${lookupCount}. Check LookupEntry data.`,
    );
  }

  const passwordPlain = prepareDemoPasswordForSeed();
  const password = await hash(passwordPlain, 12);

  const admin = await ensureUser({
    email: DEMO_ADMIN_EMAIL,
    passwordHash: password,
    name: "Lab Admin",
    roles: [LAB_ROLE.ADMIN],
  });

  const researcherUser = await ensureUser({
    email: DEMO_STAFF_EMAIL,
    passwordHash: password,
    name: "Researcher",
    roles: [LAB_ROLE.RESEARCHER],
  });

  const studentUser = await ensureUser({
    email: DEMO_STUDENT_EMAIL,
    passwordHash: password,
    name: "Student",
    roles: [LAB_ROLE.STUDENT],
  });

  for (const u of [admin, researcherUser, studentUser]) {
    await ensureUserSettingsRow(u.id);
  }

  const catRobotics = await ensureCategory("Robotics");
  const catNetwork = await ensureCategory("Networking");
  const catSensors = await ensureCategory("Sensors");
  const loc314 = await ensureLocation("Room 314");
  const locBenchA = await ensureLocation("Bench A");

  const projectAd = await ensureProject("Autonomous driving", "autonomous-driving");
  const projectIndoor = await ensureProject(
    "Indoor navigation benchmark",
    "indoor-navigation-benchmark",
  );
  await prisma.project.updateMany({
    where: { slug: "indoor-navigation-benchmark", ...notDeleted },
    data: {
      description:
        "Baseline runs for wheel odometry + lidar SLAM in the mock warehouse layout. See bench booklet for marker positions.",
      webLinks: [
        {label: "Dataset notes (internal)", url: "https://example.com/nav-bench-notes"},
        {label: "Layout diagram", url: "https://example.com/warehouse-floorplan"},
      ],
      documentLinks: [
        {label: "Safety checklist PDF", url: "https://example.com/lab-mobil-robot-checklist"},
      ],
    },
  });

  if (researcherUser) {
    await ensureProjectMember(projectAd.id, researcherUser.id);
    await ensureProjectMember(projectIndoor.id, researcherUser.id);
  }
  if (studentUser) {
    await ensureProjectMember(projectAd.id, studentUser.id);
  }
  if (admin) {
    await ensureProjectMember(projectIndoor.id, admin.id);
  }

  const robotAsset = await ensureAsset({
    skuOrInternalId: "DEMO-ROBOT-01",
    name: "ROSMASTER X3 (demo)",
    specs: { vendor: "Yahboom", controller: "Raspberry Pi 4" },
    conditionCode: "WORKING",
    operationalStatusCode: "AVAILABLE",
    quantityTotal: 1,
    quantityAvailable: 1,
    notes: "Seeded demo asset — differential drive mobile base.",
    categoryId: catRobotics.id,
    locationId: loc314.id,
    custodianUserId: admin.id,
    trackTag: "TAG-DEMO-ROBOT-01",
    acquiredAt: daysAgo(120),
  });

  const modemAsset = await ensureAsset({
    skuOrInternalId: "DEMO-5G-01",
    name: "Quectel RM520N-GL module (demo)",
    conditionCode: "WORKING",
    operationalStatusCode: "AVAILABLE",
    quantityTotal: 2,
    quantityAvailable: 2,
    notes: MODEM_SEED_NOTES,
    quoteUrl: "https://example.com/rm520n-gl",
    categoryId: catNetwork.id,
    locationId: loc314.id,
    trackTag: "TAG-DEMO-5G",
  });

  const lidarAsset = await ensureAsset({
    skuOrInternalId: "DEMO-LIDAR-01",
    name: "Velodyne VLP-16 (demo)",
    specs: { channels: 16, rangeM: 100 },
    conditionCode: "WORKING",
    operationalStatusCode: "MAINTENANCE",
    quantityTotal: 1,
    quantityAvailable: 1,
    notes: "Seeded as checked-out + overdue for lending / notifications demos.",
    categoryId: catSensors.id,
    locationId: locBenchA.id,
    custodianUserId: researcherUser.id,
    trackTag: "TAG-DEMO-LIDAR",
    acquiredAt: daysAgo(400),
  });

  await normalizeDemoAssetLookupCodes();

  const unitCount = await prisma.assetUnit.count({
    where: { assetId: modemAsset.id, ...notDeleted },
  });
  if (unitCount === 0) {
    await prisma.assetUnit.createMany({
      data: [
        {
          assetId: modemAsset.id,
          serialNumber: "5G-SN-DEMO-A",
          trackTag: "TAG-DEMO-5G-A",
        },
        {
          assetId: modemAsset.id,
          serialNumber: "5G-SN-DEMO-B",
          trackTag: "TAG-DEMO-5G-B",
        },
      ],
    });
  } else {
    await prisma.assetUnit.updateMany({
      where: {
        assetId: modemAsset.id,
        serialNumber: "5G-SN-DEMO-A",
        trackTag: null,
        ...notDeleted,
      },
      data: { trackTag: "TAG-DEMO-5G-A" },
    });
    await prisma.assetUnit.updateMany({
      where: {
        assetId: modemAsset.id,
        serialNumber: "5G-SN-DEMO-B",
        trackTag: null,
        ...notDeleted,
      },
      data: { trackTag: "TAG-DEMO-5G-B" },
    });
  }

  const inventorySeed = loadInventorySeedFile();
  const useInventorySeedApi =
    process.env.INVENTORY_SEED_VIA_API === "1" && process.env.SEED_SECRET;

  let inventoryUpserted: number;
  if (useInventorySeedApi) {
    const base = process.env.SEED_API_BASE_URL ?? "http://127.0.0.1:3000";
    const res = await fetch(`${base.replace(/\/$/, "")}/api/dev/inventory-seed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SEED_SECRET}`,
      },
      body: JSON.stringify({ items: inventorySeed.items }),
    });
    const data = (await res.json()) as {
      upserted?: number;
      errors?: { sku: string; message: string }[];
    };
    if (!res.ok) {
      console.error("INVENTORY_SEED_VIA_API failed:", res.status, data);
      process.exit(1);
    }
    if (data.errors?.length) {
      console.error("Inventory seed API row errors:", data.errors);
      process.exit(1);
    }
    inventoryUpserted = data.upserted ?? 0;
  } else {
    const { upserted, errors } = await syncInventorySeedItemsValidated(
      prisma,
      inventorySeed.items,
    );
    if (errors.length > 0) {
      console.error("Inventory seed validation errors (assetCreateSchema):", errors);
      process.exit(1);
    }
    inventoryUpserted = upserted;
  }

  const existingPendingSeedRequest = await prisma.checkoutRequest.findFirst({
    where: {
      sharedPurpose: SEED_PURPOSE_PENDING_REQUEST,
      status: CheckoutRequestStatus.PENDING_APPROVAL,
    },
  });
  if (!existingPendingSeedRequest && studentUser) {
    const pendingLineAsset = await prisma.asset.findFirst({
      where: {
        ...notDeleted,
        quantityAvailable: { gt: 0 },
        operationalStatusCode: "AVAILABLE",
        conditionCode: "WORKING",
        skuOrInternalId: { startsWith: "SYN-INV-" },
      },
      orderBy: { skuOrInternalId: "asc" },
    });
    if (pendingLineAsset) {
      await prisma.checkoutRequest.create({
        data: {
          userId: studentUser.id,
          status: CheckoutRequestStatus.PENDING_APPROVAL,
          defaultProjectId: projectAd.id,
          sharedPurpose: SEED_PURPOSE_PENDING_REQUEST,
          sharedDueAt: new Date(Date.now() + 10 * 86_400_000),
          conditionOut: {note: "For SLAM comparison week — classroom bench only."},
          lines: {
            create: [
              {
                assetId: pendingLineAsset.id,
                status: CheckoutRequestLineStatus.PENDING,
              },
            ],
          },
        },
      });
    }
  }

  const seededLoans = await prisma.checkout.findFirst({
    where: { purpose: SEED_PURPOSE_ACTIVE_MODEM },
  });

  if (!seededLoans && researcherUser && studentUser) {
    const modemUnits = await prisma.assetUnit.findMany({
      where: { assetId: modemAsset.id, ...notDeleted },
      orderBy: { serialNumber: "asc" },
    });
    const unitA = modemUnits[0];

    const dueModem = new Date(Date.now() + 7 * 86_400_000);
    const activeCheckout = await prisma.checkout.create({
      data: {
        userId: studentUser.id,
        assetId: modemAsset.id,
        assetUnitId: unitA?.id,
        projectId: projectAd.id,
        status: CheckoutStatus.ACTIVE,
        checkedOutAt: daysAgo(2),
        dueAt: dueModem,
        purpose: SEED_PURPOSE_ACTIVE_MODEM,
        conditionOut: { note: "Kit complete, antennas attached." },
      },
    });

    await prisma.asset.update({
      where: { id: modemAsset.id },
      data: { quantityAvailable: 1 },
    });

    const returnedCheckout = await prisma.checkout.create({
      data: {
        userId: researcherUser.id,
        assetId: robotAsset.id,
        projectId: projectAd.id,
        status: CheckoutStatus.RETURNED,
        checkedOutAt: daysAgo(20),
        dueAt: daysAgo(12),
        returnedAt: daysAgo(11),
        purpose: SEED_PURPOSE_RETURNED_ROBOT,
        conditionOut: { note: "Calibrated IMU." },
        conditionIn: { note: "No new damage." },
      },
    });

    const lidarDue = daysAgo(5);
    const overdueCheckout = await prisma.checkout.create({
      data: {
        userId: researcherUser.id,
        assetId: lidarAsset.id,
        projectId: projectAd.id,
        status: CheckoutStatus.OVERDUE,
        checkedOutAt: daysAgo(14),
        dueAt: lidarDue,
        purpose: SEED_PURPOSE_OVERDUE_LIDAR,
        conditionOut: { note: "Borrowed for outdoor mapping run." },
      },
    });

    await prisma.asset.update({
      where: { id: lidarAsset.id },
      data: { quantityAvailable: 0 },
    });

    const existingOverdueNotice = await prisma.notification.findFirst({
      where: {
        userId: researcherUser.id,
        body: { contains: "Velodyne VLP-16" },
      },
    });
    if (!existingOverdueNotice) {
      await prisma.notification.create({
        data: {
          userId: researcherUser.id,
          title: "Equipment overdue",
          body: `${lidarAsset.name} was due ${lidarDue.toLocaleString()}. Please return or contact the lab.`,
          read: false,
        },
      });
    }

    const importEntityId = randomUUID();
    await prisma.auditLog.createMany({
      data: [
        {
          userId: admin.id,
          entityType: AuditEntityType.AssetCategory,
          entityId: catSensors.id,
          action: AuditAction.CATEGORY_CREATE,
          diff: { name: catSensors.name },
          createdAt: daysAgo(90),
        },
        {
          userId: admin.id,
          entityType: AuditEntityType.Location,
          entityId: locBenchA.id,
          action: AuditAction.LOCATION_CREATE,
          diff: { name: locBenchA.name },
          createdAt: daysAgo(90),
        },
        {
          userId: admin.id,
          entityType: AuditEntityType.Asset,
          entityId: robotAsset.id,
          action: AuditAction.CREATE,
          diff: {
            skuOrInternalId: robotAsset.skuOrInternalId,
            name: robotAsset.name,
          },
          createdAt: daysAgo(60),
        },
        {
          userId: admin.id,
          entityType: AuditEntityType.Asset,
          entityId: modemAsset.id,
          action: AuditAction.UNIT_CREATE,
          diff: { sku: modemAsset.skuOrInternalId },
          createdAt: daysAgo(55),
        },
        {
          userId: admin.id,
          entityType: AuditEntityType.Asset,
          entityId: modemAsset.id,
          action: AuditAction.UNIT_CREATE,
          diff: { sku: modemAsset.skuOrInternalId },
          createdAt: daysAgo(55),
        },
        {
          userId: researcherUser.id,
          entityType: AuditEntityType.Project,
          entityId: projectAd.id,
          action: AuditAction.MEMBER_ADD,
          diff: { email: studentUser.email },
          createdAt: daysAgo(40),
        },
        {
          userId: admin.id,
          entityType: AuditEntityType.Asset,
          entityId: lidarAsset.id,
          action: AuditAction.CREATE,
          diff: {
            skuOrInternalId: lidarAsset.skuOrInternalId,
            name: lidarAsset.name,
          },
          createdAt: daysAgo(35),
        },
        {
          userId: researcherUser.id,
          entityType: AuditEntityType.Import,
          entityId: importEntityId,
          action: AuditAction.IMPORT,
          diff: { imported: 3, skipped: 0, fileName: "seed-demo-import.xlsx" },
          createdAt: daysAgo(30),
        },
        {
          userId: researcherUser.id,
          entityType: AuditEntityType.Asset,
          entityId: modemAsset.id,
          action: AuditAction.UPDATE,
          diff: {
            notes: {
              from: MODEM_SEED_NOTES,
              to: `${MODEM_SEED_NOTES} Antennas labeled.`,
            },
          },
          createdAt: daysAgo(25),
        },
        {
          userId: researcherUser.id,
          entityType: AuditEntityType.Checkout,
          entityId: returnedCheckout.id,
          action: AuditAction.CREATE,
          diff: {
            assetId: robotAsset.id,
            projectId: projectAd.id,
            dueAt: daysAgo(12).toISOString(),
            purpose: SEED_PURPOSE_RETURNED_ROBOT,
          },
          createdAt: daysAgo(20),
        },
        {
          userId: researcherUser.id,
          entityType: AuditEntityType.Checkout,
          entityId: returnedCheckout.id,
          action: AuditAction.RETURN,
          diff: {
            assetId: robotAsset.id,
            previousStatus: "ACTIVE",
            returnedAt: daysAgo(11).toISOString(),
          },
          createdAt: daysAgo(11),
        },
        {
          userId: studentUser.id,
          entityType: AuditEntityType.Checkout,
          entityId: activeCheckout.id,
          action: AuditAction.CREATE,
          diff: {
            assetId: modemAsset.id,
            assetUnitId: unitA?.id,
            projectId: projectAd.id,
            dueAt: dueModem.toISOString(),
            purpose: SEED_PURPOSE_ACTIVE_MODEM,
          },
          createdAt: daysAgo(2),
        },
        {
          userId: researcherUser.id,
          entityType: AuditEntityType.Checkout,
          entityId: overdueCheckout.id,
          action: AuditAction.CREATE,
          diff: {
            assetId: lidarAsset.id,
            projectId: projectAd.id,
            dueAt: lidarDue.toISOString(),
            purpose: SEED_PURPOSE_OVERDUE_LIDAR,
          },
          createdAt: daysAgo(14),
        },
        {
          userId: null,
          entityType: AuditEntityType.Checkout,
          entityId: overdueCheckout.id,
          action: AuditAction.STATUS_OVERDUE,
          diff: {
            assetId: lidarAsset.id,
            dueAt: lidarDue.toISOString(),
            previousStatus: "ACTIVE",
          },
          createdAt: daysAgo(4),
        },
      ],
    });

    await prisma.asset.update({
      where: { id: modemAsset.id },
      data: { notes: `${MODEM_SEED_NOTES} Antennas labeled.` },
    });
  }

  const pwdHint =
    process.env.SEED_DEMO_PASSWORD?.trim() || process.env.CI === "true"
      ? "(password from SEED_DEMO_PASSWORD, or labnexus123 when CI=true)."
      : `(demo password in ${seedDemoCredentialsPath()} unless SEED_DEMO_PASSWORD is set).`;
  console.log(
    `Seed OK. Dev quick login or manual sign-in: ${DEMO_ADMIN_EMAIL}, ${DEMO_STAFF_EMAIL}, ${DEMO_STUDENT_EMAIL} ${pwdHint}`,
  );
  console.log(
    `Reference data: ${lookupCount} lookup row(s) (condition + operational status); default rows maintained by ensureDefaultLookupEntries.`,
  );
  console.log(
    `Spreadsheet inventory: ${inventoryUpserted} assets upserted (${useInventorySeedApi ? "via POST /api/dev/inventory-seed" : "in-process; same validation as that route"}). JSON items may set optional "condition" / "operationalStatus" (code or label).`,
  );
  console.log(
    "Demo data: two projects (one with rich profile JSON), project members, optional pending student loan request when synthetic SKUs exist, LiDAR + overdue + notification, active modem checkout, returned robot loan, /admin/audit sample rows (first run only per DB).",
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

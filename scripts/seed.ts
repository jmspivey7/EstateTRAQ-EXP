import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import bcrypt from "bcryptjs";
import * as schema from "../src/lib/db/schema";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  console.log("Seeding EstateTRAQ v2 demo data...\n");

  const passwordHash = await bcrypt.hash("demo123", 12);

  // === ORGANIZATION ===
  const [org] = await db.insert(schema.organizations).values({
    name: "Henry Estate Advisory",
    type: "advisory_firm",
  }).returning();
  console.log("Created organization:", org.name);

  // === FAMILIES ===
  const [woodwardFamily] = await db.insert(schema.families).values({
    organizationId: org.id,
    name: "Woodward Family",
    mode: "lifetime",
    description: "Robert & Catherine Woodward family estate. Approximately $40M in diversified assets across real estate, investments, mineral rights, and business interests.",
    modulesEnabled: [
      "dashboard", "accounts", "documents", "compliance", "users",
      "holdings", "real_estate", "minerals", "insurance", "business",
      "personal_assets", "income_expenses", "estate",
    ],
  }).returning();
  console.log("Created family:", woodwardFamily.name);

  const [chenFamily] = await db.insert(schema.families).values({
    organizationId: org.id,
    name: "Chen Family",
    mode: "lifetime",
    description: "David & Linda Chen family estate. Approximately $32M primarily in investment accounts and Houston real estate.",
    modulesEnabled: [
      "dashboard", "accounts", "documents", "compliance", "users",
      "holdings", "real_estate", "insurance", "income_expenses",
    ],
  }).returning();
  console.log("Created family:", chenFamily.name);

  // === USERS ===
  const [robert] = await db.insert(schema.users).values({
    email: "robert@woodward.demo",
    passwordHash,
    firstName: "Robert",
    lastName: "Woodward",
  }).returning();

  const [sarah] = await db.insert(schema.users).values({
    email: "sarah@woodward.demo",
    passwordHash,
    firstName: "Sarah",
    lastName: "Woodward",
  }).returning();

  const [miriam] = await db.insert(schema.users).values({
    email: "miriam@advisor.demo",
    passwordHash,
    firstName: "Miriam",
    lastName: "Henry",
  }).returning();

  const [david] = await db.insert(schema.users).values({
    email: "david@chen.demo",
    passwordHash,
    firstName: "David",
    lastName: "Chen",
  }).returning();

  console.log("Created users: Robert, Sarah, Miriam, David");

  // === FAMILY-USER MAPPINGS ===
  await db.insert(schema.familyUsers).values([
    { userId: robert.id, familyId: woodwardFamily.id, role: "family_manager", isDefault: true },
    { userId: sarah.id, familyId: woodwardFamily.id, role: "family_viewer", isDefault: true },
    { userId: miriam.id, familyId: woodwardFamily.id, role: "advisor", isDefault: false },
    { userId: miriam.id, familyId: chenFamily.id, role: "advisor", isDefault: true },
    { userId: david.id, familyId: chenFamily.id, role: "family_manager", isDefault: true },
  ]);
  console.log("Mapped users to families");

  // === WOODWARD ACCOUNTS (manual — will be replaced by Plaid) ===
  const woodwardAccounts = [
    { name: "Woodward Family Checking", type: "checking" as const, institutionName: "First National Bank", currentBalance: "845000", mask: "4521" },
    { name: "Woodward Savings", type: "savings" as const, institutionName: "First National Bank", currentBalance: "1250000", mask: "7832" },
    { name: "Catherine Money Market", type: "money_market" as const, institutionName: "First National Bank", currentBalance: "2400000", mask: "1199" },
    { name: "Robert Fidelity Brokerage", type: "brokerage" as const, institutionName: "Fidelity Investments", currentBalance: "9800000", mask: "5567" },
    { name: "Catherine Schwab Brokerage", type: "brokerage" as const, institutionName: "Charles Schwab", currentBalance: "8200000", mask: "3301" },
    { name: "Robert IRA", type: "retirement" as const, institutionName: "Fidelity Investments", currentBalance: "1850000", mask: "9912" },
    { name: "Catherine IRA", type: "retirement" as const, institutionName: "Charles Schwab", currentBalance: "1620000", mask: "4478" },
  ];

  for (const acct of woodwardAccounts) {
    await db.insert(schema.accounts).values({
      familyId: woodwardFamily.id,
      name: acct.name,
      type: acct.type,
      institutionName: acct.institutionName,
      currentBalance: acct.currentBalance,
      mask: acct.mask,
      isManual: true,
    });
  }
  console.log("Created Woodward accounts");

  // === WOODWARD REAL ESTATE ===
  await db.insert(schema.realEstate).values([
    {
      familyId: woodwardFamily.id,
      name: "Woodward Residence",
      propertyType: "primary_residence",
      address: "1842 St. Charles Avenue",
      city: "New Orleans",
      state: "Louisiana",
      zipCode: "70130",
      latitude: "29.9250",
      longitude: "-90.0900",
      purchasePrice: "1800000",
      currentValue: "2800000",
      description: "Historic Garden District home. 5BR/4BA, 4,200 sq ft. Built 1895, extensively renovated 2018.",
    },
    {
      familyId: woodwardFamily.id,
      name: "Rosemary Beach Cottage",
      propertyType: "vacation",
      address: "78 Main Street",
      city: "Rosemary Beach",
      state: "Florida",
      zipCode: "32461",
      latitude: "30.2820",
      longitude: "-86.0160",
      purchasePrice: "1200000",
      currentValue: "1600000",
      description: "3BR/2BA beach cottage in Rosemary Beach. Purchased 2019. Generates $95K annual rental income.",
    },
    {
      familyId: woodwardFamily.id,
      name: "Tishomingo Ranch",
      propertyType: "land",
      address: "County Road 48",
      city: "Tishomingo",
      state: "Mississippi",
      zipCode: "38873",
      latitude: "34.4365",
      longitude: "-88.2356",
      purchasePrice: "1800000",
      currentValue: "3200000",
      acreage: "850",
      description: "850-acre timberland and hunting ranch. Active timber management plan. Annual timber revenue ~$120K.",
    },
  ]);
  console.log("Created Woodward real estate");

  // === WOODWARD MINERAL RIGHTS ===
  await db.insert(schema.oilGasMinerals).values([
    {
      familyId: woodwardFamily.id,
      name: "East Texas Mineral Interest",
      type: "oil_gas",
      location: "Rusk County, Texas",
      state: "Texas",
      county: "Rusk",
      netAcres: "320",
      royaltyRate: "0.1875",
      estimatedValue: "2100000",
      annualIncome: "185000",
      operator: "Devon Energy",
      aiSummary: "The Woodward mineral interest in Rusk County sits within the prolific Haynesville Shale formation. Current production is primarily natural gas with associated condensate. Devon Energy operates 12 active wells on the tract with consistent production over the past 8 years. The royalty rate of 18.75% is standard for the region. Recent horizontal drilling activity in adjacent tracts suggests potential for additional development. Annual royalty income has been stable at approximately $185,000, with modest upside potential if natural gas prices strengthen above $4/mcf.",
    },
  ]);
  console.log("Created Woodward mineral rights");

  // === WOODWARD BUSINESS INTERESTS ===
  await db.insert(schema.businessInterests).values([
    {
      familyId: woodwardFamily.id,
      entityName: "Crescent City Commercial Holdings, LLC",
      entityType: "LLC",
      ownershipPercent: "35.0000",
      estimatedValue: "4800000",
      annualDistributions: "340000",
      description: "Commercial real estate LLC holding three Class B office properties in Metairie, LA. Robert is a 35% member. Properties are 92% occupied. Professional management through Stirling Properties.",
    },
  ]);
  console.log("Created Woodward business interests");

  // === WOODWARD INSURANCE ===
  await db.insert(schema.insurancePolicies).values([
    {
      familyId: woodwardFamily.id,
      policyNumber: "WL-2847291",
      type: "whole_life",
      carrier: "Northwestern Mutual",
      insured: "Robert Woodward",
      beneficiary: "Catherine Woodward",
      coverageAmount: "2000000",
      cashValue: "680000",
      premiumAmount: "18500",
      premiumFrequency: "annual",
    },
    {
      familyId: woodwardFamily.id,
      policyNumber: "TL-9938271",
      type: "term_life",
      carrier: "New York Life",
      insured: "Robert Woodward",
      beneficiary: "Woodward Family Trust",
      coverageAmount: "1000000",
      premiumAmount: "4200",
      premiumFrequency: "annual",
    },
  ]);
  console.log("Created Woodward insurance");

  // === WOODWARD COMPLIANCE CALENDAR ===
  const now = new Date();
  const upcoming = (daysFromNow: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysFromNow);
    return d;
  };

  await db.insert(schema.complianceItems).values([
    {
      familyId: woodwardFamily.id,
      title: "Mississippi Property Tax - Tishomingo Ranch",
      type: "property_tax",
      status: "due_soon",
      dueDate: upcoming(12),
      amount: "8450",
      description: "Annual property tax payment for 850-acre Tishomingo Ranch parcel.",
      recurrence: "annual",
    },
    {
      familyId: woodwardFamily.id,
      title: "Q1 Estimated Federal Tax Payment",
      type: "estimated_tax",
      status: "upcoming",
      dueDate: upcoming(24),
      amount: "62000",
      description: "First quarter estimated federal income tax payment.",
      recurrence: "quarterly",
    },
    {
      familyId: woodwardFamily.id,
      title: "Northwestern Mutual Premium Due",
      type: "insurance_premium",
      status: "upcoming",
      dueDate: upcoming(35),
      amount: "18500",
      description: "Annual whole life insurance premium for policy WL-2847291.",
      recurrence: "annual",
    },
    {
      familyId: woodwardFamily.id,
      title: "Louisiana Homestead Exemption Renewal",
      type: "legal_filing",
      status: "upcoming",
      dueDate: upcoming(60),
      description: "Annual homestead exemption filing for St. Charles Avenue residence.",
      recurrence: "annual",
    },
    {
      familyId: woodwardFamily.id,
      title: "Review Schwab Quarterly Statement",
      type: "other",
      status: "upcoming",
      dueDate: upcoming(5),
      description: "Catherine's Schwab brokerage Q4 statement ready for review.",
      recurrence: "quarterly",
    },
  ]);
  console.log("Created Woodward compliance items");

  // === WOODWARD HEIRS ===
  const [robertHeir] = await db.insert(schema.heirs).values({
    familyId: woodwardFamily.id,
    firstName: "Robert",
    lastName: "Woodward",
    relationship: "Patriarch",
    heirType: "original",
    sharePercent: "50.0000",
    email: "robert@woodward.demo",
  }).returning();

  const [catherineHeir] = await db.insert(schema.heirs).values({
    familyId: woodwardFamily.id,
    firstName: "Catherine",
    lastName: "Woodward",
    relationship: "Matriarch",
    heirType: "spouse",
    parentHeirId: robertHeir.id,
    sharePercent: "50.0000",
  }).returning();

  await db.insert(schema.heirs).values([
    {
      familyId: woodwardFamily.id,
      firstName: "Sarah",
      lastName: "Woodward-Mitchell",
      relationship: "Daughter",
      heirType: "child",
      parentHeirId: robertHeir.id,
      sharePercent: "33.3333",
      email: "sarah@woodward.demo",
    },
    {
      familyId: woodwardFamily.id,
      firstName: "Michael",
      lastName: "Woodward",
      relationship: "Son",
      heirType: "child",
      parentHeirId: robertHeir.id,
      sharePercent: "33.3333",
    },
    {
      familyId: woodwardFamily.id,
      firstName: "James",
      lastName: "Woodward",
      relationship: "Son",
      heirType: "child",
      parentHeirId: robertHeir.id,
      sharePercent: "33.3334",
    },
  ]);
  console.log("Created Woodward heirs");

  // === WOODWARD PORTFOLIO HISTORY (12 months) ===
  const baseValue = 38000000;
  const monthlySnapshots = [];
  for (let i = 365; i >= 0; i -= 7) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const variance = (Math.random() - 0.45) * 800000;
    const trend = (365 - i) * 5500;
    monthlySnapshots.push({
      familyId: woodwardFamily.id,
      date,
      totalValue: String(Math.round(baseValue + trend + variance)),
      cashValue: String(Math.round(4500000 + (Math.random() - 0.5) * 200000)),
      investmentValue: String(Math.round(18000000 + trend * 0.6 + variance * 0.5)),
      realEstateValue: "7600000",
    });
  }
  await db.insert(schema.portfolioSnapshots).values(monthlySnapshots);
  console.log("Created Woodward portfolio history (52 weeks)");

  // === CHEN FAMILY ACCOUNTS ===
  const chenAccounts = [
    { name: "Chen Family Checking", type: "checking" as const, institutionName: "JPMorgan Chase", currentBalance: "420000", mask: "8812" },
    { name: "Chen Savings", type: "savings" as const, institutionName: "JPMorgan Chase", currentBalance: "1800000", mask: "3301" },
    { name: "David Merrill Lynch Brokerage", type: "brokerage" as const, institutionName: "Merrill Lynch", currentBalance: "16500000", mask: "6634" },
    { name: "Linda Vanguard IRA", type: "retirement" as const, institutionName: "Vanguard", currentBalance: "2200000", mask: "1187" },
    { name: "David 401k", type: "retirement" as const, institutionName: "Fidelity Investments", currentBalance: "3100000", mask: "5502" },
  ];

  for (const acct of chenAccounts) {
    await db.insert(schema.accounts).values({
      familyId: chenFamily.id,
      name: acct.name,
      type: acct.type,
      institutionName: acct.institutionName,
      currentBalance: acct.currentBalance,
      mask: acct.mask,
      isManual: true,
    });
  }
  console.log("Created Chen accounts");

  // === CHEN REAL ESTATE ===
  await db.insert(schema.realEstate).values([
    {
      familyId: chenFamily.id,
      name: "Chen Residence",
      propertyType: "primary_residence",
      address: "4200 River Oaks Boulevard",
      city: "Houston",
      state: "Texas",
      zipCode: "77019",
      purchasePrice: "3200000",
      currentValue: "4200000",
      description: "5BR/5BA residence in River Oaks. 5,800 sq ft with pool and guest house.",
    },
    {
      familyId: chenFamily.id,
      name: "Galveston Beach House",
      propertyType: "vacation",
      address: "1221 Seawall Boulevard",
      city: "Galveston",
      state: "Texas",
      zipCode: "77550",
      purchasePrice: "1400000",
      currentValue: "1800000",
      description: "Beachfront property. 4BR/3BA. Generates ~$70K annual rental income.",
    },
  ]);
  console.log("Created Chen real estate");

  // === CHEN PORTFOLIO HISTORY ===
  const chenBase = 30000000;
  const chenSnapshots = [];
  for (let i = 365; i >= 0; i -= 7) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const variance = (Math.random() - 0.45) * 600000;
    const trend = (365 - i) * 4500;
    chenSnapshots.push({
      familyId: chenFamily.id,
      date,
      totalValue: String(Math.round(chenBase + trend + variance)),
      cashValue: String(Math.round(2200000 + (Math.random() - 0.5) * 100000)),
      investmentValue: String(Math.round(21800000 + trend * 0.7 + variance * 0.5)),
      realEstateValue: "6000000",
    });
  }
  await db.insert(schema.portfolioSnapshots).values(chenSnapshots);
  console.log("Created Chen portfolio history");

  console.log("\n=== Seed Complete ===");
  console.log(`Organization: ${org.name}`);
  console.log(`Families: ${woodwardFamily.name}, ${chenFamily.name}`);
  console.log(`Users: Robert (manager), Sarah (viewer), Miriam (advisor), David (manager)`);
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error("Seed failed:", err);
    pool.end().then(() => process.exit(1));
  });

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// ENUMS
// ============================================================

export const userRoleEnum = pgEnum("user_role", [
  "family_manager",
  "family_viewer",
  "advisor",
  "cpa",
  "executor",
  "assistant",
]);

export const familyModeEnum = pgEnum("family_mode", [
  "lifetime",
  "estate",
]);

export const accountTypeEnum = pgEnum("account_type", [
  "checking",
  "savings",
  "money_market",
  "cd",
  "brokerage",
  "retirement",
  "credit_card",
  "loan",
  "mortgage",
  "other",
]);

export const assetCategoryEnum = pgEnum("asset_category", [
  "cash",
  "investments",
  "real_estate",
  "minerals",
  "insurance",
  "business",
  "personal",
  "other",
]);

export const complianceStatusEnum = pgEnum("compliance_status", [
  "upcoming",
  "due_soon",
  "overdue",
  "completed",
  "dismissed",
]);

export const complianceTypeEnum = pgEnum("compliance_type", [
  "property_tax",
  "estimated_tax",
  "insurance_premium",
  "rmd",
  "trust_reporting",
  "legal_filing",
  "license_renewal",
  "other",
]);

export const documentCategoryEnum = pgEnum("document_category", [
  "legal",
  "financial",
  "property",
  "insurance",
  "tax",
  "estate_planning",
  "correspondence",
  "other",
]);

export const heirTypeEnum = pgEnum("heir_type", [
  "original",
  "spouse",
  "child",
  "grandchild",
  "other",
]);

export const distributionStatusEnum = pgEnum("distribution_status", [
  "planned",
  "approved",
  "distributed",
  "cancelled",
]);

export const recurrenceEnum = pgEnum("recurrence", [
  "once",
  "monthly",
  "quarterly",
  "semi_annual",
  "annual",
]);

// ============================================================
// CORE MULTI-TENANT TABLES
// ============================================================

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull().default("independent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const families = pgTable("families", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  mode: familyModeEnum("mode").notNull().default("lifetime"),
  modulesEnabled: jsonb("modules_enabled").$type<string[]>().notNull().default([
    "dashboard",
    "accounts",
    "documents",
    "compliance",
    "users",
  ]),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("families_org_idx").on(table.organizationId),
}));

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  avatarUrl: text("avatar_url"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex("users_email_idx").on(table.email),
}));

export const familyUsers = pgTable("family_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  role: userRoleEnum("role").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userFamilyIdx: uniqueIndex("family_users_user_family_idx").on(table.userId, table.familyId),
  familyIdx: index("family_users_family_idx").on(table.familyId),
}));

// ============================================================
// PLAID INTEGRATION
// ============================================================

export const plaidItems = pgTable("plaid_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  accessToken: text("access_token").notNull(),
  itemId: varchar("item_id", { length: 255 }).notNull(),
  institutionId: varchar("institution_id", { length: 100 }),
  institutionName: varchar("institution_name", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  familyIdx: index("plaid_items_family_idx").on(table.familyId),
}));

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  plaidItemId: uuid("plaid_item_id").references(() => plaidItems.id),
  plaidAccountId: varchar("plaid_account_id", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  officialName: varchar("official_name", { length: 255 }),
  type: accountTypeEnum("type").notNull(),
  subtype: varchar("subtype", { length: 100 }),
  institutionName: varchar("institution_name", { length: 255 }),
  mask: varchar("mask", { length: 10 }),
  currentBalance: decimal("current_balance", { precision: 18, scale: 2 }),
  availableBalance: decimal("available_balance", { precision: 18, scale: 2 }),
  isManual: boolean("is_manual").notNull().default(false),
  isHidden: boolean("is_hidden").notNull().default(false),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  familyIdx: index("accounts_family_idx").on(table.familyId),
  plaidItemIdx: index("accounts_plaid_item_idx").on(table.plaidItemId),
}));

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  plaidTransactionId: varchar("plaid_transaction_id", { length: 255 }),
  date: timestamp("date").notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  merchantName: varchar("merchant_name", { length: 255 }),
  category: varchar("category", { length: 255 }),
  pending: boolean("pending").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  familyIdx: index("transactions_family_idx").on(table.familyId),
  accountIdx: index("transactions_account_idx").on(table.accountId),
  dateIdx: index("transactions_date_idx").on(table.date),
}));

// ============================================================
// MARKET INVESTMENTS MODULE
// ============================================================

export const holdings = pgTable("holdings", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  accountId: uuid("account_id").references(() => accounts.id),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  shares: decimal("shares", { precision: 18, scale: 6 }).notNull(),
  costBasis: decimal("cost_basis", { precision: 18, scale: 2 }),
  currentPrice: decimal("current_price", { precision: 18, scale: 4 }),
  previousClose: decimal("previous_close", { precision: 18, scale: 4 }),
  dayChange: decimal("day_change", { precision: 18, scale: 4 }),
  dayChangePercent: decimal("day_change_percent", { precision: 10, scale: 4 }),
  lastUpdated: timestamp("last_updated"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  familyIdx: index("holdings_family_idx").on(table.familyId),
}));

export const historicalPrices = pgTable("historical_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  date: timestamp("date").notNull(),
  open: decimal("open", { precision: 18, scale: 4 }),
  high: decimal("high", { precision: 18, scale: 4 }),
  low: decimal("low", { precision: 18, scale: 4 }),
  close: decimal("close", { precision: 18, scale: 4 }).notNull(),
  volume: integer("volume"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  symbolDateIdx: uniqueIndex("historical_prices_symbol_date_idx").on(table.symbol, table.date),
}));

export const portfolioSnapshots = pgTable("portfolio_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  date: timestamp("date").notNull(),
  totalValue: decimal("total_value", { precision: 18, scale: 2 }).notNull(),
  cashValue: decimal("cash_value", { precision: 18, scale: 2 }),
  investmentValue: decimal("investment_value", { precision: 18, scale: 2 }),
  realEstateValue: decimal("real_estate_value", { precision: 18, scale: 2 }),
  otherValue: decimal("other_value", { precision: 18, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  familyDateIdx: uniqueIndex("portfolio_snapshots_family_date_idx").on(table.familyId, table.date),
}));

// ============================================================
// REAL ESTATE MODULE
// ============================================================

export const realEstate = pgTable("real_estate", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  propertyType: varchar("property_type", { length: 100 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  purchasePrice: decimal("purchase_price", { precision: 18, scale: 2 }),
  purchaseDate: timestamp("purchase_date"),
  currentValue: decimal("current_value", { precision: 18, scale: 2 }),
  lastAppraisalDate: timestamp("last_appraisal_date"),
  acreage: decimal("acreage", { precision: 12, scale: 2 }),
  description: text("description"),
  kmlContent: text("kml_content"),
  isSold: boolean("is_sold").notNull().default(false),
  salePrice: decimal("sale_price", { precision: 18, scale: 2 }),
  saleDate: timestamp("sale_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  familyIdx: index("real_estate_family_idx").on(table.familyId),
}));

// ============================================================
// OIL, GAS & MINERALS MODULE
// ============================================================

export const oilGasMinerals = pgTable("oil_gas_minerals", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  location: text("location"),
  state: varchar("state", { length: 50 }),
  county: varchar("county", { length: 100 }),
  netAcres: decimal("net_acres", { precision: 12, scale: 4 }),
  royaltyRate: decimal("royalty_rate", { precision: 8, scale: 6 }),
  estimatedValue: decimal("estimated_value", { precision: 18, scale: 2 }),
  annualIncome: decimal("annual_income", { precision: 18, scale: 2 }),
  operator: varchar("operator", { length: 255 }),
  aiSummary: text("ai_summary"),
  aiSummaryUpdatedAt: timestamp("ai_summary_updated_at"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  kmlContent: text("kml_content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  familyIdx: index("oil_gas_minerals_family_idx").on(table.familyId),
}));

// ============================================================
// INSURANCE MODULE
// ============================================================

export const insurancePolicies = pgTable("insurance_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  policyNumber: varchar("policy_number", { length: 100 }),
  type: varchar("type", { length: 100 }).notNull(),
  carrier: varchar("carrier", { length: 255 }).notNull(),
  insured: varchar("insured", { length: 255 }),
  beneficiary: varchar("beneficiary", { length: 255 }),
  coverageAmount: decimal("coverage_amount", { precision: 18, scale: 2 }),
  cashValue: decimal("cash_value", { precision: 18, scale: 2 }),
  premiumAmount: decimal("premium_amount", { precision: 18, scale: 2 }),
  premiumFrequency: recurrenceEnum("premium_frequency"),
  effectiveDate: timestamp("effective_date"),
  expirationDate: timestamp("expiration_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  familyIdx: index("insurance_policies_family_idx").on(table.familyId),
}));

// ============================================================
// PRIVATE BUSINESS MODULE
// ============================================================

export const businessInterests = pgTable("business_interests", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  entityName: varchar("entity_name", { length: 255 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  ownershipPercent: decimal("ownership_percent", { precision: 8, scale: 4 }),
  estimatedValue: decimal("estimated_value", { precision: 18, scale: 2 }),
  lastValuationDate: timestamp("last_valuation_date"),
  annualDistributions: decimal("annual_distributions", { precision: 18, scale: 2 }),
  ein: varchar("ein", { length: 20 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  familyIdx: index("business_interests_family_idx").on(table.familyId),
}));

// ============================================================
// PERSONAL ASSETS MODULE
// ============================================================

export const personalAssets = pgTable("personal_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  estimatedValue: decimal("estimated_value", { precision: 18, scale: 2 }),
  purchasePrice: decimal("purchase_price", { precision: 18, scale: 2 }),
  purchaseDate: timestamp("purchase_date"),
  lastAppraisalDate: timestamp("last_appraisal_date"),
  location: varchar("location", { length: 255 }),
  description: text("description"),
  insured: boolean("insured").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  familyIdx: index("personal_assets_family_idx").on(table.familyId),
}));

// ============================================================
// DOCUMENT VAULT
// ============================================================

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  category: documentCategoryEnum("category").notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  relatedEntityType: varchar("related_entity_type", { length: 100 }),
  relatedEntityId: uuid("related_entity_id"),
  aiTags: jsonb("ai_tags").$type<string[]>(),
  aiSummary: text("ai_summary"),
  uploadedById: uuid("uploaded_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  familyIdx: index("documents_family_idx").on(table.familyId),
  categoryIdx: index("documents_category_idx").on(table.category),
}));

// ============================================================
// COMPLIANCE CALENDAR
// ============================================================

export const complianceItems = pgTable("compliance_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  type: complianceTypeEnum("type").notNull(),
  status: complianceStatusEnum("status").notNull().default("upcoming"),
  dueDate: timestamp("due_date").notNull(),
  completedDate: timestamp("completed_date"),
  amount: decimal("amount", { precision: 18, scale: 2 }),
  actionUrl: text("action_url"),
  recurrence: recurrenceEnum("recurrence").notNull().default("once"),
  relatedEntityType: varchar("related_entity_type", { length: 100 }),
  relatedEntityId: uuid("related_entity_id"),
  assignedToId: uuid("assigned_to_id").references(() => users.id),
  completedById: uuid("completed_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  familyIdx: index("compliance_items_family_idx").on(table.familyId),
  dueDateIdx: index("compliance_items_due_date_idx").on(table.dueDate),
  statusIdx: index("compliance_items_status_idx").on(table.status),
}));

// ============================================================
// ESTATE ADMINISTRATION MODULE
// ============================================================

export const heirs = pgTable("heirs", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  relationship: varchar("relationship", { length: 100 }).notNull(),
  heirType: heirTypeEnum("heir_type").notNull(),
  parentHeirId: uuid("parent_heir_id"),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  dateOfBirth: timestamp("date_of_birth"),
  sharePercent: decimal("share_percent", { precision: 8, scale: 4 }),
  isDisclaimed: boolean("is_disclaimed").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  familyIdx: index("heirs_family_idx").on(table.familyId),
}));

export const distributions = pgTable("distributions", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  heirId: uuid("heir_id").references(() => heirs.id).notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  description: text("description"),
  distributionDate: timestamp("distribution_date"),
  status: distributionStatusEnum("status").notNull().default("planned"),
  assetCategory: assetCategoryEnum("asset_category"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  familyIdx: index("distributions_family_idx").on(table.familyId),
  heirIdx: index("distributions_heir_idx").on(table.heirId),
}));

export const executorUpdates = pgTable("executor_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  authorId: uuid("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  familyIdx: index("executor_updates_family_idx").on(table.familyId),
}));

// ============================================================
// INCOME & EXPENSES MODULE
// ============================================================

export const incomeStreams = pgTable("income_streams", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", { length: 255 }),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  recurrence: recurrenceEnum("recurrence").notNull().default("once"),
  category: varchar("category", { length: 100 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  relatedEntityType: varchar("related_entity_type", { length: 100 }),
  relatedEntityId: uuid("related_entity_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  familyIdx: index("income_streams_family_idx").on(table.familyId),
}));

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  payee: varchar("payee", { length: 255 }),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  recurrence: recurrenceEnum("recurrence").notNull().default("once"),
  category: varchar("category", { length: 100 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  relatedEntityType: varchar("related_entity_type", { length: 100 }),
  relatedEntityId: uuid("related_entity_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  familyIdx: index("expenses_family_idx").on(table.familyId),
}));

// ============================================================
// ACTIVITY LOG
// ============================================================

export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  userId: uuid("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  familyIdx: index("activity_log_family_idx").on(table.familyId),
  createdIdx: index("activity_log_created_idx").on(table.createdAt),
}));

// ============================================================
// SETTINGS
// ============================================================

export const familySettings = pgTable("family_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").references(() => families.id).notNull(),
  key: varchar("key", { length: 100 }).notNull(),
  value: text("value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  familyKeyIdx: uniqueIndex("family_settings_family_key_idx").on(table.familyId, table.key),
}));

// ============================================================
// RELATIONS
// ============================================================

export const organizationsRelations = relations(organizations, ({ many }) => ({
  families: many(families),
}));

export const familiesRelations = relations(families, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [families.organizationId],
    references: [organizations.id],
  }),
  familyUsers: many(familyUsers),
  accounts: many(accounts),
  holdings: many(holdings),
  realEstate: many(realEstate),
  oilGasMinerals: many(oilGasMinerals),
  insurancePolicies: many(insurancePolicies),
  businessInterests: many(businessInterests),
  personalAssets: many(personalAssets),
  documents: many(documents),
  complianceItems: many(complianceItems),
  heirs: many(heirs),
  distributions: many(distributions),
  executorUpdates: many(executorUpdates),
  incomeStreams: many(incomeStreams),
  expenses: many(expenses),
  plaidItems: many(plaidItems),
  portfolioSnapshots: many(portfolioSnapshots),
  activityLog: many(activityLog),
  settings: many(familySettings),
}));

export const usersRelations = relations(users, ({ many }) => ({
  familyUsers: many(familyUsers),
}));

export const familyUsersRelations = relations(familyUsers, ({ one }) => ({
  user: one(users, {
    fields: [familyUsers.userId],
    references: [users.id],
  }),
  family: one(families, {
    fields: [familyUsers.familyId],
    references: [families.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  family: one(families, {
    fields: [accounts.familyId],
    references: [families.id],
  }),
  plaidItem: one(plaidItems, {
    fields: [accounts.plaidItemId],
    references: [plaidItems.id],
  }),
  transactions: many(transactions),
  holdings: many(holdings),
}));

export const holdingsRelations = relations(holdings, ({ one }) => ({
  family: one(families, {
    fields: [holdings.familyId],
    references: [families.id],
  }),
  account: one(accounts, {
    fields: [holdings.accountId],
    references: [accounts.id],
  }),
}));

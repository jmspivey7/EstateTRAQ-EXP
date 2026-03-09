/**
 * Database Setup Script
 *
 * Run this after your database is connected:
 *   1. Make sure DATABASE_URL is set (Replit Secrets or .env)
 *   2. Run: npm run setup
 *
 * This script pushes the schema to the database and seeds demo data.
 */

import { execSync } from "child_process";

console.log("=== EstateTRAQ v2 Database Setup ===\n");

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is not set.");
  console.error("  - In Replit: Add it under Secrets (lock icon)");
  console.error("  - Locally: Create a .env file with DATABASE_URL=your_connection_string");
  process.exit(1);
}

console.log("Step 1: Pushing schema to database...");
try {
  execSync("npx drizzle-kit push", { stdio: "inherit" });
  console.log("Schema pushed successfully.\n");
} catch (error) {
  console.error("Failed to push schema. Check your DATABASE_URL.");
  process.exit(1);
}

console.log("Step 2: Seeding demo data...");
try {
  execSync("npx tsx scripts/seed.ts", { stdio: "inherit" });
  console.log("Seed completed successfully.\n");
} catch (error) {
  console.error("Failed to seed data.");
  process.exit(1);
}

console.log("=== Setup Complete ===");
console.log("Run 'npm run dev' to start the application.");
console.log("\nDemo accounts:");
console.log("  robert@woodward.demo / demo123 (Family Manager)");
console.log("  sarah@woodward.demo / demo123 (Family Viewer)");
console.log("  miriam@advisor.demo / demo123 (Advisor - sees both families)");

import fs from "node:fs/promises";
import pg from "pg";
import { config } from "../config.js";

const { Pool } = pg;

/**
 * Aplica el esquema. En un proyecto más grande esto sería una herramienta
 * de migraciones (node-pg-migrate, Prisma, etc.); acá alcanza con un script
 * idempotente y reproducible.
 */
async function migrate() {
  if (!config.databaseUrl) {
    console.error("Falta DATABASE_URL. Copiá backend/.env.example a backend/.env");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  const sql = await fs.readFile(new URL("./schema.sql", import.meta.url), "utf8");

  console.log("Aplicando esquema...");
  await pool.query(sql);
  await pool.end();
  console.log("Esquema aplicado correctamente.");
}

migrate().catch((error) => {
  console.error("Error aplicando el esquema:", error);
  process.exit(1);
});

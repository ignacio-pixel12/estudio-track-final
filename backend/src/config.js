import "dotenv/config";

/**
 * Configuración centralizada.
 * Regla del proyecto: la app no lee process.env fuera de este archivo.
 */
export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  pomodoro: {
    focusMinutes: 25,
    breakMinutes: 5,
  },
};

export const isTest = config.nodeEnv === "test";
export const usesDatabase = Boolean(config.databaseUrl) && !isTest;

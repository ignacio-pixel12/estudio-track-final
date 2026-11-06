import { config, usesDatabase } from "../config.js";

/**
 * Factory de repositorios: la app no sabe si persiste en PostgreSQL o en memoria.
 * Esto es inversión de dependencias aplicada a la persistencia.
 */
export async function createRepository() {
  if (usesDatabase) {
    const { createPgRepository } = await import("./pgTaskRepository.js");
    return createPgRepository(config.databaseUrl);
  }
  const { createMemoryRepository } = await import("./memoryTaskRepository.js");
  return createMemoryRepository({ seedDefaults: true });
}

import { createApp } from "./app.js";
import { config, usesDatabase } from "./config.js";
import { createRepository } from "./repositories/index.js";
import { createTaskService } from "./services/taskService.js";

async function main() {
  const repository = await createRepository();
  const service = createTaskService({ repository, pomodoro: config.pomodoro });
  const app = createApp({ service, corsOrigin: config.corsOrigin });

  const server = app.listen(config.port, () => {
    console.log(`Estudio Track API escuchando en http://localhost:${config.port}`);
    console.log(`Persistencia: ${usesDatabase ? "PostgreSQL" : "memoria (sin DATABASE_URL)"}`);
  });

  const shutdown = async () => {
    console.log("\nCerrando servidor...");
    server.close(async () => {
      if (typeof repository.close === "function") await repository.close();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("No se pudo iniciar la API:", error);
  process.exit(1);
});

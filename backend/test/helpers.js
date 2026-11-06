import { config } from "../src/config.js";
import { createTaskService } from "../src/services/taskService.js";
import { createMemoryRepository } from "../src/repositories/memoryTaskRepository.js";

/** Helpers compartidos por los tests: app real + repositorio en memoria. */
export async function buildTestContext() {
  const repository = createMemoryRepository();
  const service = createTaskService({ repository, pomodoro: config.pomodoro });

  // Import dinámico: evita levantar Express si el test es puramente de dominio.
  const { createApp } = await import("../src/app.js");
  const app = createApp({ service });

  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  const request = async (path, options = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const text = await response.text();
    return {
      status: response.status,
      body: text ? JSON.parse(text) : null,
    };
  };

  return {
    repository,
    service,
    request,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

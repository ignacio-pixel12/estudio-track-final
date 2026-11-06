import { config } from "../config.js";
import { createPgRepository } from "../repositories/pgTaskRepository.js";

/**
 * Datos de demostración. Si ya hay tareas, no hace nada.
 * Sirve para que el deploy de Render/Neon arranque con contenido visible.
 */
async function seed() {
  if (!config.databaseUrl) {
    console.error("Falta DATABASE_URL.");
    process.exit(1);
  }

  const repository = createPgRepository(config.databaseUrl);

  const tasks = await repository.listTasks({});
  if (tasks.length > 0) {
    console.log("La base ya tiene tareas. No se inserta nada.");
    if (repository.close) await repository.close();
    return;
  }

  let subjects = await repository.listSubjects();
  if (subjects.length === 0) {
    subjects = [
      await repository.createSubject({ name: "Matemática", color: "#6366f1" }),
      await repository.createSubject({ name: "Historia", color: "#f59e0b" }),
      await repository.createSubject({ name: "Programación", color: "#22c55e" }),
    ];
  }

  const [math, history, programming] = subjects;
  const created = [
    await repository.createTask({
      title: "Resolver guía de integrales",
      subjectId: math.id,
      estimatedPomodoros: 3,
    }),
    await repository.createTask({
      title: "Resumir capítulo 4 de Historia",
      subjectId: history.id,
      estimatedPomodoros: 2,
    }),
    await repository.createTask({
      title: "Terminar el TP de backend",
      subjectId: programming.id,
      estimatedPomodoros: 4,
    }),
  ];

  await repository.createSession({
    taskId: created[2].id,
    type: "focus",
    durationMinutes: 25,
    endedAt: new Date().toISOString(),
  });

  await repository.updateTask(created[2].id, { status: "en_progreso" });

  console.log(`Seed listo: ${subjects.length} materias y ${created.length} tareas.`);
  if (repository.close) await repository.close();
}

seed().catch((error) => {
  console.error("Error en el seed:", error);
  process.exit(1);
});

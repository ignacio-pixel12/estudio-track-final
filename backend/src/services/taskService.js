import { ConflictError, NotFoundError } from "../domain/errors.js";
import {
  assertCanRegisterSession,
  assertValidSession,
  normalizeEstimatedPomodoros,
  TASK_STATUS,
} from "../domain/taskRules.js";
import {
  createSubjectSchema,
  createTaskSchema,
  listTasksQuerySchema,
  parse,
  sessionSchema,
  updateTaskSchema,
} from "../lib/validate.js";

/**
 * Capa de servicios: acá viven las reglas de negocio.
 * No conoce Express ni SQL. Recibe el repositorio por inyección.
 */
export function createTaskService({ repository, pomodoro }) {
  const requireTask = async (id) => {
    const task = await repository.findTask(id);
    if (!task) throw new NotFoundError("Tarea", id);
    return task;
  };

  return {
    // ---------- Materias ----------
    async listSubjects() {
      return repository.listSubjects();
    },

    async createSubject(payload) {
      const data = parse(createSubjectSchema, payload);
      const existing = await repository.findSubjectByName(data.name);
      if (existing) {
        throw new ConflictError(`Ya existe una materia llamada "${data.name}".`, {
          subjectId: existing.id,
        });
      }
      return repository.createSubject(data);
    },

    // ---------- Tareas ----------
    async listTasks(query) {
      const filters = parse(listTasksQuerySchema, query ?? {});
      return repository.listTasks(filters);
    },

    async getTask(id) {
      return requireTask(id);
    },

    async createTask(payload) {
      const data = parse(createTaskSchema, payload);
      const subject = await repository.findSubject(data.subjectId);
      if (!subject) throw new NotFoundError("Materia", data.subjectId);

      return repository.createTask({
        ...data,
        estimatedPomodoros: normalizeEstimatedPomodoros(data.estimatedPomodoros),
      });
    },

    async updateTask(id, payload) {
      const task = await requireTask(id);
      const data = parse(updateTaskSchema, payload);

      if (data.subjectId) {
        const subject = await repository.findSubject(data.subjectId);
        if (!subject) throw new NotFoundError("Materia", data.subjectId);
      }

      if (data.estimatedPomodoros !== undefined) {
        data.estimatedPomodoros = normalizeEstimatedPomodoros(data.estimatedPomodoros);
      }

      // Reabrir una tarea completada es una decisión explícita del usuario.
      if (data.status && data.status !== TASK_STATUS.DONE && task.status === TASK_STATUS.DONE) {
        data.completedAt = null;
      }

      return repository.updateTask(id, data);
    },

    async completeTask(id) {
      const task = await requireTask(id);
      if (task.status === TASK_STATUS.DONE) return task; // idempotente
      return repository.updateTask(id, { status: TASK_STATUS.DONE });
    },

    async deleteTask(id) {
      await requireTask(id);
      await repository.deleteTask(id);
      return { deleted: true, id };
    },

    // ---------- Pomodoro ----------
    async listSessions(taskId) {
      await requireTask(taskId);
      return repository.listSessions(taskId);
    },

    async registerSession(taskId, payload) {
      const task = await requireTask(taskId);
      assertCanRegisterSession(task);

      const data = parse(sessionSchema, payload ?? {});
      const durationMinutes =
        data.durationMinutes ??
        (data.type === "focus" ? pomodoro.focusMinutes : pomodoro.breakMinutes);
      assertValidSession({ type: data.type, durationMinutes }, pomodoro);

      return repository.createSession({
        taskId,
        type: data.type,
        durationMinutes,
        endedAt: new Date().toISOString(),
      });
    },

    // ---------- Métricas ----------
    async getStats() {
      return repository.stats();
    },
  };
}

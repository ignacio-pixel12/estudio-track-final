import { randomUUID } from "node:crypto";

const DEFAULT_SUBJECTS = [
  { name: "Matemática", color: "#6366f1" },
  { name: "Historia", color: "#f59e0b" },
];

/**
 * Repositorio en memoria.
 * Existe por dos motivos:
 *  1. Permite correr la API sin PostgreSQL (`npm run dev` sin variables).
 *  2. Permite testear la lógica sin infraestructura (tests rápidos y deterministas).
 * Cumple exactamente el mismo contrato que `pgTaskRepository`.
 */
export function createMemoryRepository({ seedDefaults = false } = {}) {
  const subjects = [];
  const tasks = [];
  const sessions = [];

  const now = () => new Date().toISOString();

  const findSubject = (id) => subjects.find((s) => s.id === id) ?? null;

  const withRelations = (task) => {
    const subject = findSubject(task.subjectId);
    return {
      ...task,
      subject: subject ? { id: subject.id, name: subject.name, color: subject.color } : null,
      completedPomodoros: sessions.filter((s) => s.taskId === task.id && s.type === "focus").length,
      totalFocusMinutes: sessions
        .filter((s) => s.taskId === task.id && s.type === "focus")
        .reduce((acc, s) => acc + s.durationMinutes, 0),
    };
  };

  if (seedDefaults) {
    for (const subject of DEFAULT_SUBJECTS) {
      subjects.push({
        id: randomUUID(),
        name: subject.name,
        color: subject.color,
        createdAt: now(),
      });
    }
  }

  return {
    async listSubjects() {
      return [...subjects].sort((a, b) => a.name.localeCompare(b.name));
    },

    async findSubject(id) {
      return findSubject(id);
    },

    async findSubjectByName(name) {
      return subjects.find((s) => s.name.toLowerCase() === name.toLowerCase()) ?? null;
    },

    async createSubject({ name, color }) {
      const subject = {
        id: randomUUID(),
        name,
        color: color ?? "#6366f1",
        createdAt: now(),
      };
      subjects.push(subject);
      return subject;
    },

    async listTasks({ subjectId, status } = {}) {
      return tasks
        .filter((task) => (subjectId ? task.subjectId === subjectId : true))
        .filter((task) => (status ? task.status === status : true))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(withRelations);
    },

    async findTask(id) {
      const task = tasks.find((t) => t.id === id);
      return task ? withRelations(task) : null;
    },

    async createTask({ title, subjectId, estimatedPomodoros = 1, notes = null }) {
      const task = {
        id: randomUUID(),
        title,
        subjectId,
        status: "pendiente",
        estimatedPomodoros,
        notes,
        createdAt: now(),
        updatedAt: now(),
        completedAt: null,
      };
      tasks.push(task);
      return withRelations(task);
    },

    async updateTask(id, patch) {
      const task = tasks.find((t) => t.id === id);
      if (!task) return null;
      Object.assign(task, patch, { updatedAt: now() });
      if (patch.status === "completada" && !task.completedAt) task.completedAt = now();
      if (patch.status && patch.status !== "completada") task.completedAt = null;
      return withRelations(task);
    },

    async deleteTask(id) {
      const index = tasks.findIndex((t) => t.id === id);
      if (index === -1) return false;
      tasks.splice(index, 1);
      for (let i = sessions.length - 1; i >= 0; i -= 1) {
        if (sessions[i].taskId === id) sessions.splice(i, 1);
      }
      return true;
    },

    async listSessions(taskId) {
      return sessions
        .filter((s) => s.taskId === taskId)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    },

    async createSession({ taskId, type, durationMinutes, endedAt = null }) {
      const session = {
        id: randomUUID(),
        taskId,
        type,
        durationMinutes,
        startedAt: now(),
        endedAt,
      };
      sessions.push(session);
      return session;
    },

    async stats() {
      const focusSessions = sessions.filter((s) => s.type === "focus");
      return {
        subjects: subjects.length,
        tasksTotal: tasks.length,
        tasksByStatus: {
          pendiente: tasks.filter((t) => t.status === "pendiente").length,
          en_progreso: tasks.filter((t) => t.status === "en_progreso").length,
          completada: tasks.filter((t) => t.status === "completada").length,
        },
        focusSessions: focusSessions.length,
        focusMinutes: focusSessions.reduce((acc, s) => acc + s.durationMinutes, 0),
      };
    },
  };
}

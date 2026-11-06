import { ConflictError, DomainError } from "./errors.js";

export const TASK_STATUS = Object.freeze({
  PENDING: "pendiente",
  IN_PROGRESS: "en_progreso",
  DONE: "completada",
});

export const TASK_STATUS_VALUES = Object.freeze(Object.values(TASK_STATUS));
export const SESSION_TYPES = Object.freeze(["focus", "break"]);

/**
 * Regla 1: una tarea completada no admite nuevas sesiones de estudio.
 * Si se quiere seguir estudiando, primero hay que reabrirla.
 */
export function assertCanRegisterSession(task) {
  if (task.status === TASK_STATUS.DONE) {
    throw new ConflictError(
      "No se pueden registrar pomodoros sobre una tarea completada. Reabrí la tarea primero.",
      { taskId: task.id, status: task.status },
    );
  }
}

/**
 * Regla 2: completar una tarea es idempotente (no rompe si se repite).
 * Devuelve true si hubo cambio real de estado.
 */
export function completeTask(task) {
  if (task.status === TASK_STATUS.DONE) return false;
  task.status = TASK_STATUS.DONE;
  task.completedAt = new Date().toISOString();
  return true;
}

/**
 * Regla 3: solo se aceptan sesiones de 25 minutos (focus) o 5 minutos (break).
 * Evita datos basura: el Pomodoro es una unidad cerrada, no un cronómetro libre.
 */
export function assertValidSession({ type, durationMinutes }, { focusMinutes, breakMinutes }) {
  if (!SESSION_TYPES.includes(type)) {
    throw new DomainError(`Tipo de sesión inválido: ${type}. Usá "focus" o "break".`);
  }
  const expected = type === "focus" ? focusMinutes : breakMinutes;
  if (durationMinutes !== expected) {
    throw new DomainError(
      `La sesión de tipo "${type}" debe durar ${expected} minutos (recibido: ${durationMinutes}).`,
    );
  }
}

/**
 * Regla 4: el estado inicial siempre es "pendiente" y los pomodoros estimados
 * se cuentan por bloques enteros, mínimo 1.
 */
export function normalizeEstimatedPomodoros(value) {
  if (value === undefined || value === null) return 1;
  if (!Number.isInteger(value) || value < 1 || value > 50) {
    throw new DomainError("Los pomodoros estimados deben ser un entero entre 1 y 50.");
  }
  return value;
}

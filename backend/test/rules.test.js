import assert from "node:assert/strict";
import test from "node:test";
import { ConflictError, DomainError } from "../src/domain/errors.js";
import {
  assertCanRegisterSession,
  assertValidSession,
  completeTask,
  normalizeEstimatedPomodoros,
  TASK_STATUS,
} from "../src/domain/taskRules.js";

const POMODORO = { focusMinutes: 25, breakMinutes: 5 };

test("no se puede registrar un pomodoro sobre una tarea completada", () => {
  assert.throws(
    () => assertCanRegisterSession({ id: "t1", status: TASK_STATUS.DONE }),
    (error) => error instanceof ConflictError && error.status === 409,
  );
});

test("se puede registrar un pomodoro sobre una tarea pendiente o en progreso", () => {
  assert.doesNotThrow(() => assertCanRegisterSession({ id: "t1", status: TASK_STATUS.PENDING }));
  assert.doesNotThrow(() => assertCanRegisterSession({ id: "t1", status: TASK_STATUS.IN_PROGRESS }));
});

test("las sesiones solo aceptan 25 minutos de focus o 5 de break", () => {
  assert.doesNotThrow(() =>
    assertValidSession({ type: "focus", durationMinutes: 25 }, POMODORO),
  );
  assert.doesNotThrow(() =>
    assertValidSession({ type: "break", durationMinutes: 5 }, POMODORO),
  );

  assert.throws(
    () => assertValidSession({ type: "focus", durationMinutes: 5 }, POMODORO),
    (error) => error instanceof DomainError && error.status === 400,
  );
  assert.throws(
    () => assertValidSession({ type: "otro", durationMinutes: 25 }, POMODORO),
    (error) => error instanceof DomainError,
  );
});

test("los pomodoros estimados son enteros entre 1 y 50, con default 1", () => {
  assert.equal(normalizeEstimatedPomodoros(undefined), 1);
  assert.equal(normalizeEstimatedPomodoros(3), 3);
  assert.throws(() => normalizeEstimatedPomodoros(0), DomainError);
  assert.throws(() => normalizeEstimatedPomodoros(51), DomainError);
  assert.throws(() => normalizeEstimatedPomodoros(2.5), DomainError);
});

test("completar una tarea es idempotente", () => {
  const task = { status: TASK_STATUS.PENDING, completedAt: null };
  assert.equal(completeTask(task), true);
  assert.equal(task.status, TASK_STATUS.DONE);
  assert.ok(task.completedAt);

  const firstCompletedAt = task.completedAt;
  assert.equal(completeTask(task), false);
  assert.equal(task.completedAt, firstCompletedAt);
});

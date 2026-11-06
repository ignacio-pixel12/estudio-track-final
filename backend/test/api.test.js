import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { buildTestContext } from "./helpers.js";

describe("API de Estudio Track", () => {
  let ctx;
  let mathId;
  let taskId;

  before(async () => {
    ctx = await buildTestContext();
  });

  after(() => ctx.close());

  it("GET /health responde ok", async () => {
    const { status, body } = await ctx.request("/health");
    assert.equal(status, 200);
    assert.equal(body.status, "ok");
  });

  it("crea una materia", async () => {
    const { status, body } = await ctx.request("/subjects", {
      method: "POST",
      body: { name: "Matemática", color: "#6366f1" },
    });
    assert.equal(status, 201);
    assert.equal(body.data.name, "Matemática");
    mathId = body.data.id;
    assert.ok(mathId);
  });

  it("rechaza materias duplicadas con 409", async () => {
    const { status, body } = await ctx.request("/subjects", {
      method: "POST",
      body: { name: "matemática" },
    });
    assert.equal(status, 409);
    assert.equal(body.error.code, "CONFLICT");
  });

  it("crea una tarea con pomodoros estimados por defecto", async () => {
    const { status, body } = await ctx.request("/tasks", {
      method: "POST",
      body: { title: "Resolver guía de integrales", subjectId: mathId },
    });
    assert.equal(status, 201);
    assert.equal(body.data.status, "pendiente");
    assert.equal(body.data.estimatedPomodoros, 1);
    assert.equal(body.data.completedPomodoros, 0);
    taskId = body.data.id;
  });

  it("rechaza títulos demasiado cortos con 422", async () => {
    const { status, body } = await ctx.request("/tasks", {
      method: "POST",
      body: { title: "ab", subjectId: mathId },
    });
    assert.equal(status, 422);
    assert.equal(body.error.code, "UNPROCESSABLE_ENTITY");
  });

  it("rechaza una materia inexistente con 404", async () => {
    const { status } = await ctx.request("/tasks", {
      method: "POST",
      body: { title: "Tarea válida", subjectId: "00000000-0000-4000-8000-000000000000" },
    });
    assert.equal(status, 404);
  });

  it("lista tareas y filtra por estado", async () => {
    const all = await ctx.request("/tasks");
    assert.equal(all.status, 200);
    assert.equal(all.body.data.length, 1);

    const pending = await ctx.request("/tasks?status=pendiente");
    assert.equal(pending.body.data.length, 1);

    const done = await ctx.request("/tasks?status=completada");
    assert.equal(done.body.data.length, 0);
  });

  it("actualiza el estado a en_progreso", async () => {
    const { status, body } = await ctx.request(`/tasks/${taskId}`, {
      method: "PATCH",
      body: { status: "en_progreso" },
    });
    assert.equal(status, 200);
    assert.equal(body.data.status, "en_progreso");
  });

  it("registra un pomodoro de 25 minutos", async () => {
    const { status, body } = await ctx.request(`/tasks/${taskId}/sessions`, {
      method: "POST",
      body: {},
    });
    assert.equal(status, 201);
    assert.equal(body.data.type, "focus");
    assert.equal(body.data.durationMinutes, 25);

    const task = await ctx.request(`/tasks/${taskId}`);
    assert.equal(task.body.data.completedPomodoros, 1);
    assert.equal(task.body.data.totalFocusMinutes, 25);
  });

  it("registra un descanso de 5 minutos", async () => {
    const { status, body } = await ctx.request(`/tasks/${taskId}/sessions`, {
      method: "POST",
      body: { type: "break" },
    });
    assert.equal(status, 201);
    assert.equal(body.data.type, "break");
    assert.equal(body.data.durationMinutes, 5);
  });

  it("rechaza una sesión con duración distinta a la del Pomodoro", async () => {
    const { status, body } = await ctx.request(`/tasks/${taskId}/sessions`, {
      method: "POST",
      body: { type: "focus", durationMinutes: 10 },
    });
    assert.equal(status, 400);
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });

  it("completa la tarea y no permite más sesiones", async () => {
    const completed = await ctx.request(`/tasks/${taskId}/complete`, { method: "POST" });
    assert.equal(completed.status, 200);
    assert.equal(completed.body.data.status, "completada");

    // Idempotente: completar dos veces no falla.
    const again = await ctx.request(`/tasks/${taskId}/complete`, { method: "POST" });
    assert.equal(again.status, 200);

    const session = await ctx.request(`/tasks/${taskId}/sessions`, { method: "POST", body: {} });
    assert.equal(session.status, 409);
    assert.equal(session.body.error.code, "CONFLICT");
  });

  it("expone métricas agregadas", async () => {
    const { status, body } = await ctx.request("/stats");
    assert.equal(status, 200);
    assert.equal(body.data.tasksTotal, 1);
    assert.equal(body.data.tasksByStatus.completada, 1);
    assert.equal(body.data.focusSessions, 1);
    assert.equal(body.data.focusMinutes, 25);
  });

  it("elimina la tarea y devuelve 404 al buscarla", async () => {
    const deleted = await ctx.request(`/tasks/${taskId}`, { method: "DELETE" });
    assert.equal(deleted.status, 204);

    const missing = await ctx.request(`/tasks/${taskId}`);
    assert.equal(missing.status, 404);
    assert.equal(missing.body.error.code, "NOT_FOUND");
  });
});

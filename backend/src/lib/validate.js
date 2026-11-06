import { DomainError } from "../domain/errors.js";
import { TASK_STATUS_VALUES, SESSION_TYPES } from "../domain/taskRules.js";
import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres.")
    .max(120, "El título no puede superar los 120 caracteres."),
  subjectId: z.string().uuid("La materia debe ser un UUID válido."),
  estimatedPomodoros: z.number().int().min(1).max(50).optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(3).max(120).optional(),
    subjectId: z.string().uuid().optional(),
    status: z.enum(TASK_STATUS_VALUES).optional(),
    estimatedPomodoros: z.number().int().min(1).max(50).optional(),
    notes: z.string().max(500).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Enviá al menos un campo para actualizar.",
  });

export const createSubjectSchema = z.object({
  name: z.string().trim().min(2, "La materia debe tener al menos 2 caracteres.").max(60),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "El color debe tener formato hexadecimal (#RRGGBB).")
    .optional(),
});

export const sessionSchema = z.object({
  type: z.enum(SESSION_TYPES).default("focus"),
  durationMinutes: z.number().int().positive().optional(),
});

export const listTasksQuerySchema = z.object({
  subjectId: z.string().uuid().optional(),
  status: z.enum(TASK_STATUS_VALUES).optional(),
});

/** Convierte un error de Zod en un DomainError legible. */
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new DomainError("Datos inválidos.", {
      status: 422,
      code: "UNPROCESSABLE_ENTITY",
      details: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }
  return result.data;
}

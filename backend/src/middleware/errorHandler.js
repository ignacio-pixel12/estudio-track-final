import { DomainError } from "../domain/errors.js";

/** Traduce errores de dominio a respuestas HTTP consistentes. */
export function errorHandler(error, _req, res, _next) {
  if (error instanceof DomainError) {
    return res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
  }

  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({
      error: { code: "BAD_JSON", message: "El cuerpo del request no es un JSON válido." },
    });
  }

  console.error("[error]", error);
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." },
  });
}

export function notFoundHandler(_req, res) {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Ruta no encontrada." },
  });
}

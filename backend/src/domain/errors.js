/**
 * Errores de dominio: no saben nada de HTTP.
 * El middleware `errorHandler` los traduce a códigos de estado.
 */
export class DomainError extends Error {
  constructor(message, { status = 400, code = "VALIDATION_ERROR", details } = {}) {
    super(message);
    this.name = "DomainError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends DomainError {
  constructor(resource, id) {
    super(`${resource} no encontrado: ${id}`, { status: 404, code: "NOT_FOUND" });
  }
}

export class ConflictError extends DomainError {
  constructor(message, details) {
    super(message, { status: 409, code: "CONFLICT", details });
  }
}

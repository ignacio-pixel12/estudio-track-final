const STATUS_LABEL = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
};

export function TaskList({ tasks, loading, onFocus, onComplete, onReopen, onDelete, onUpdate }) {
  if (loading) {
    return <p className="muted">Cargando tareas…</p>;
  }

  if (tasks.length === 0) {
    return (
      <div className="empty">
        <p>No hay tareas con estos filtros.</p>
        <span>Creá una nueva o cambiá el filtro para ver otras.</span>
      </div>
    );
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => {
        const progress = Math.min(
          100,
          Math.round((task.completedPomodoros / task.estimatedPomodoros) * 100),
        );

        return (
          <li key={task.id} className={`task task-${task.status}`}>
            <div className="task-head">
              <span className="chip-dot" style={{ backgroundColor: task.subject?.color ?? "#6366f1" }} />
              <h3>{task.title}</h3>
              <span className={`badge badge-${task.status}`}>{STATUS_LABEL[task.status]}</span>
            </div>

            <p className="task-meta">
              {task.subject?.name ?? "Sin materia"} · {task.completedPomodoros}/
              {task.estimatedPomodoros} pomodoros
              {task.notes ? ` · ${task.notes}` : ""}
            </p>

            <div className="progress" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>

            <div className="task-actions">
              {task.status !== "completada" && (
                <>
                  <button type="button" className="btn small" onClick={() => onFocus(task)}>
                    Enfocar
                  </button>
                  <button type="button" className="btn small primary" onClick={() => onComplete(task.id)}>
                    Completar
                  </button>
                </>
              )}

              {task.status === "completada" && (
                <button type="button" className="btn small" onClick={() => onReopen(task.id)}>
                  Reabrir
                </button>
              )}

              <span className="spacer" />

              <div className="stepper" aria-label="Ajustar pomodoros estimados">
                <button
                  type="button"
                  className="btn tiny"
                  onClick={() =>
                    onUpdate(task.id, {
                      estimatedPomodoros: Math.max(1, task.estimatedPomodoros - 1),
                    })
                  }
                  disabled={task.estimatedPomodoros <= 1}
                  aria-label="Restar pomodoro estimado"
                >
                  −
                </button>
                <button
                  type="button"
                  className="btn tiny"
                  onClick={() =>
                    onUpdate(task.id, {
                      estimatedPomodoros: Math.min(50, task.estimatedPomodoros + 1),
                    })
                  }
                  disabled={task.estimatedPomodoros >= 50}
                  aria-label="Sumar pomodoro estimado"
                >
                  +
                </button>
              </div>

              <button type="button" className="btn tiny danger" onClick={() => onDelete(task.id)}>
                Eliminar
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

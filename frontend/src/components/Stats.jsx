export function Stats({ stats }) {
  const items = [
    { label: "Pendientes", value: stats?.tasksByStatus?.pendiente ?? 0, tone: "pending" },
    { label: "En progreso", value: stats?.tasksByStatus?.en_progreso ?? 0, tone: "progress" },
    { label: "Completadas", value: stats?.tasksByStatus?.completada ?? 0, tone: "done" },
    { label: "Pomodoros", value: stats?.focusSessions ?? 0, tone: "focus" },
    { label: "Minutos de foco", value: stats?.focusMinutes ?? 0, tone: "focus" },
  ];

  return (
    <section className="stats" aria-label="Resumen de estudio">
      {items.map((item) => (
        <article key={item.label} className={`stat stat-${item.tone}`}>
          <span className="stat-value">{item.value}</span>
          <span className="stat-label">{item.label}</span>
        </article>
      ))}
    </section>
  );
}

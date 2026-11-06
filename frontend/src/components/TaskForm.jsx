import { useState } from "react";

const INITIAL = { title: "", subjectId: "", estimatedPomodoros: 1, notes: "" };

export function TaskForm({ subjects, onCreate }) {
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);

  const update = (field) => (event) => {
    const value = field === "estimatedPomodoros" ? Number(event.target.value) : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const subjectId = form.subjectId || subjects[0]?.id;
    if (!form.title.trim() || !subjectId) return;

    setSaving(true);
    try {
      await onCreate({
        title: form.title.trim(),
        subjectId,
        estimatedPomodoros: form.estimatedPomodoros,
        notes: form.notes.trim() || null,
      });
      setForm({ ...INITIAL, subjectId });
    } finally {
      setSaving(false);
    }
  };

  const disabled = subjects.length === 0 || form.title.trim().length < 3;

  return (
    <form onSubmit={submit} className="stack">
      <label>
        Título
        <input
          type="text"
          value={form.title}
          onChange={update("title")}
          placeholder="Ej: Resumir capítulo 4"
          maxLength={120}
          required
        />
      </label>

      <div className="grid-2">
        <label>
          Materia
          <select value={form.subjectId || subjects[0]?.id || ""} onChange={update("subjectId")}>
            {subjects.length === 0 && <option value="">Creá una materia primero</option>}
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Pomodoros estimados
          <input
            type="number"
            min="1"
            max="50"
            value={form.estimatedPomodoros}
            onChange={update("estimatedPomodoros")}
          />
        </label>
      </div>

      <label>
        Notas (opcional)
        <textarea
          value={form.notes}
          onChange={update("notes")}
          rows={2}
          maxLength={500}
          placeholder="Detalles, links o lo que necesites recordar"
        />
      </label>

      <button type="submit" className="btn primary" disabled={saving || disabled}>
        {saving ? "Creando…" : "Crear tarea"}
      </button>

      {subjects.length === 0 && (
        <p className="hint">Primero creá una materia en el panel de la izquierda.</p>
      )}
    </form>
  );
}

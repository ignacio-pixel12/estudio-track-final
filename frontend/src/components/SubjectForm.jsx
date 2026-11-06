import { useState } from "react";

export function SubjectForm({ subjects, onCreate }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onCreate({ name: name.trim(), color });
      setName("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="subject-form">
      <form onSubmit={submit} className="inline-form">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej: Física"
          maxLength={60}
          aria-label="Nombre de la materia"
        />
        <input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          aria-label="Color de la materia"
          className="color-input"
        />
        <button type="submit" className="btn primary" disabled={saving || name.trim().length < 2}>
          {saving ? "Agregando…" : "Agregar"}
        </button>
      </form>

      <ul className="chips">
        {subjects.map((subject) => (
          <li key={subject.id} className="chip">
            <span className="chip-dot" style={{ backgroundColor: subject.color }} />
            {subject.name}
          </li>
        ))}
        {subjects.length === 0 && <li className="muted">Todavía no hay materias.</li>}
      </ul>
    </div>
  );
}

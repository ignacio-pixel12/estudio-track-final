import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const FOCUS_MINUTES = 25;

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
};

export function PomodoroTimer({ tasks, taskId, onTaskChange, onSessionSaved }) {
  const [mode, setMode] = useState("focus");
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const finishing = useRef(false);

  const total = mode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS;

  useEffect(() => {
    setSecondsLeft(total);
    setRunning(false);
    setMessage("");
    finishing.current = false;
  }, [mode, total]);

  useEffect(() => {
    if (!running) return undefined;
    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (!running || secondsLeft > 0 || finishing.current) return;
    finishing.current = true;
    setRunning(false);

    const finish = async () => {
      if (mode === "break") {
        setMessage("Descanso terminado. ¡Volvemos al foco!");
        return;
      }

      if (!taskId) {
        setMessage("Pomodoro completado. Elegí una tarea para que quede registrado.");
        return;
      }

      setSaving(true);
      try {
        await api.registerSession(taskId, { type: "focus", durationMinutes: FOCUS_MINUTES });
        setMessage("Pomodoro registrado correctamente.");
        onSessionSaved?.();
      } catch (error) {
        setMessage(error.message);
        finishing.current = false;
      } finally {
        setSaving(false);
      }
    };

    finish();
  }, [running, secondsLeft, mode, taskId, onSessionSaved]);

  const reset = () => {
    setSecondsLeft(total);
    setRunning(false);
    setMessage("");
    finishing.current = false;
  };

  const progress = ((total - secondsLeft) / total) * 100;

  return (
    <div className="card pomodoro">
      <div className="pomodoro-modes">
        <button
          type="button"
          className={`btn small ${mode === "focus" ? "primary" : "ghost"}`}
          onClick={() => setMode("focus")}
          disabled={running}
        >
          Foco · 25 min
        </button>
        <button
          type="button"
          className={`btn small ${mode === "break" ? "primary" : "ghost"}`}
          onClick={() => setMode("break")}
          disabled={running}
        >
          Descanso · 5 min
        </button>
      </div>

      <p className="pomodoro-time" aria-live="polite">
        {formatTime(secondsLeft)}
      </p>

      <div className="progress big" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <label className="pomodoro-task">
        Tarea en foco
        <select value={taskId} onChange={(event) => onTaskChange(event.target.value)} disabled={running}>
          <option value="">Sin tarea seleccionada</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
      </label>

      <div className="pomodoro-actions">
        <button
          type="button"
          className="btn primary"
          onClick={() => setRunning((current) => !current)}
          disabled={secondsLeft === 0 || saving}
        >
          {running ? "Pausar" : secondsLeft === 0 ? "Terminado" : "Iniciar"}
        </button>
        <button type="button" className="btn ghost" onClick={reset}>
          Reiniciar
        </button>
      </div>

      {message && <p className="pomodoro-message">{message}</p>}
      {saving && <p className="muted">Guardando pomodoro…</p>}
    </div>
  );
}

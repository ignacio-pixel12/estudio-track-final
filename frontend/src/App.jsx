import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import { Stats } from "./components/Stats.jsx";
import { SubjectForm } from "./components/SubjectForm.jsx";
import { TaskForm } from "./components/TaskForm.jsx";
import { TaskList } from "./components/TaskList.jsx";
import { PomodoroTimer } from "./components/PomodoroTimer.jsx";

const EMPTY_FILTERS = { subjectId: "", status: "" };

export default function App() {
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [focusTaskId, setFocusTaskId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("et-theme") ?? "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("et-theme", theme);
  }, [theme]);

  const refresh = useCallback(async () => {
    try {
      setError("");
      const [nextSubjects, nextTasks, nextStats] = await Promise.all([
        api.listSubjects(),
        api.listTasks(filters),
        api.stats(),
      ]);
      setSubjects(nextSubjects);
      setTasks(nextTasks);
      setStats(nextStats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Si la tarea enfocada se completó o se borró, dejamos el timer sin tarea.
  useEffect(() => {
    if (!focusTaskId) return;
    const stillOpen = tasks.some((task) => task.id === focusTaskId && task.status !== "completada");
    if (!stillOpen) setFocusTaskId("");
  }, [tasks, focusTaskId]);

  const run = async (action) => {
    try {
      setError("");
      await action();
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const createSubject = (data) => run(() => api.createSubject(data));
  const createTask = (data) => run(() => api.createTask(data));
  const updateTask = (id, data) => run(() => api.updateTask(id, data));
  const deleteTask = (id) => run(() => api.deleteTask(id));
  const completeTask = (id) => run(() => api.completeTask(id));
  const reopenTask = (id) => run(() => api.updateTask(id, { status: "pendiente" }));

  const focusTask = (task) => {
    setFocusTaskId(task.id);
    if (task.status === "pendiente") {
      run(() => api.updateTask(task.id, { status: "en_progreso" }));
    }
  };

  const openTasks = tasks.filter((task) => task.status !== "completada");

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ⏱
          </span>
          <div>
            <h1>Estudio Track</h1>
            <p>Materias, tareas y pomodoros en un solo lugar.</p>
          </div>
        </div>
        <button
          type="button"
          className="btn ghost"
          onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          aria-label="Cambiar tema"
        >
          {theme === "dark" ? "☀️ Claro" : "🌙 Oscuro"}
        </button>
      </header>

      {error && (
        <div className="alert" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      )}

      <Stats stats={stats} />

      <main className="layout">
        <section className="column">
          <PomodoroTimer
            tasks={openTasks}
            taskId={focusTaskId}
            onTaskChange={setFocusTaskId}
            onSessionSaved={refresh}
          />

          <div className="card">
            <h2>Materias</h2>
            <SubjectForm subjects={subjects} onCreate={createSubject} />
          </div>

          <div className="card">
            <h2>Filtros</h2>
            <div className="filters">
              <label>
                Materia
                <select
                  value={filters.subjectId}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, subjectId: event.target.value }))
                  }
                >
                  <option value="">Todas</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Estado
                <select
                  value={filters.status}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, status: event.target.value }))
                  }
                >
                  <option value="">Todos</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="en_progreso">En progreso</option>
                  <option value="completada">Completadas</option>
                </select>
              </label>

              {(filters.subjectId || filters.status) && (
                <button type="button" className="btn ghost" onClick={() => setFilters(EMPTY_FILTERS)}>
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="column">
          <div className="card">
            <h2>Nueva tarea</h2>
            <TaskForm subjects={subjects} onCreate={createTask} />
          </div>

          <div className="card">
            <div className="card-heading">
              <h2>Tareas</h2>
              <span className="counter">{tasks.length}</span>
            </div>
            <TaskList
              tasks={tasks}
              loading={loading}
              onFocus={focusTask}
              onComplete={completeTask}
              onReopen={reopenTask}
              onDelete={deleteTask}
              onUpdate={updateTask}
            />
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>Estudio Track · Trabajo final Generación T</span>
        <span>API: {import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}</span>
      </footer>
    </div>
  );
}

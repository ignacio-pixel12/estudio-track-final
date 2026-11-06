import pg from "pg";

const { Pool } = pg;

const TASK_SELECT = `
  select
    t.id,
    t.title,
    t.subject_id        as "subjectId",
    t.status,
    t.estimated_pomodoros as "estimatedPomodoros",
    t.notes,
    t.created_at        as "createdAt",
    t.updated_at        as "updatedAt",
    t.completed_at      as "completedAt",
    s.name              as "subjectName",
    s.color             as "subjectColor",
    coalesce((
      select count(*) from pomodoro_sessions p
      where p.task_id = t.id and p.type = 'focus'
    ), 0)::int          as "completedPomodoros",
    coalesce((
      select sum(p.duration_minutes) from pomodoro_sessions p
      where p.task_id = t.id and p.type = 'focus'
    ), 0)::int          as "totalFocusMinutes"
  from tasks t
  join subjects s on s.id = t.subject_id
`;

const mapTask = (row) => ({
  id: row.id,
  title: row.title,
  subjectId: row.subjectId,
  status: row.status,
  estimatedPomodoros: row.estimatedPomodoros,
  notes: row.notes,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  completedAt: row.completedAt,
  completedPomodoros: row.completedPomodoros,
  totalFocusMinutes: row.totalFocusMinutes,
  subject: { id: row.subjectId, name: row.subjectName, color: row.subjectColor },
});

/**
 * Implementación PostgreSQL (Neon en producción, Docker en local).
 * SQL parametrizado siempre: nada de concatenar strings con input del usuario.
 */
export function createPgRepository(databaseUrl) {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false },
    max: 5,
  });

  const query = (text, params) => pool.query(text, params);

  const repository = {
    async close() {
      await pool.end();
    },

    async listSubjects() {
      const { rows } = await query(
        `select id, name, color, created_at as "createdAt" from subjects order by name asc`,
      );
      return rows;
    },

    async findSubject(id) {
      const { rows } = await query(
        `select id, name, color, created_at as "createdAt" from subjects where id = $1`,
        [id],
      );
      return rows[0] ?? null;
    },

    async findSubjectByName(name) {
      const { rows } = await query(`select id, name, color from subjects where lower(name) = lower($1)`, [
        name,
      ]);
      return rows[0] ?? null;
    },

    async createSubject({ name, color }) {
      const { rows } = await query(
        `insert into subjects (name, color) values ($1, coalesce($2, '#6366f1'))
         returning id, name, color, created_at as "createdAt"`,
        [name, color ?? null],
      );
      return rows[0];
    },

    async listTasks({ subjectId, status } = {}) {
      const { rows } = await query(
        `${TASK_SELECT}
         where ($1::uuid is null or t.subject_id = $1)
           and ($2::text is null or t.status = $2)
         order by t.created_at desc`,
        [subjectId ?? null, status ?? null],
      );
      return rows.map(mapTask);
    },

    async findTask(id) {
      const { rows } = await query(`${TASK_SELECT} where t.id = $1`, [id]);
      return rows[0] ? mapTask(rows[0]) : null;
    },

    async createTask({ title, subjectId, estimatedPomodoros = 1, notes = null }) {
      const { rows } = await query(
        `insert into tasks (title, subject_id, estimated_pomodoros, notes)
         values ($1, $2, $3, $4)
         returning id`,
        [title, subjectId, estimatedPomodoros, notes],
      );
      const { rows: created } = await query(`${TASK_SELECT} where t.id = $1`, [rows[0].id]);
      return mapTask(created[0]);
    },

    async updateTask(id, patch) {
      const fields = [];
      const values = [];
      let index = 1;

      const assign = (column, value) => {
        fields.push(`${column} = $${index}`);
        values.push(value);
        index += 1;
      };

      if (patch.title !== undefined) assign("title", patch.title);
      if (patch.subjectId !== undefined) assign("subject_id", patch.subjectId);
      if (patch.estimatedPomodoros !== undefined) {
        assign("estimated_pomodoros", patch.estimatedPomodoros);
      }
      if (patch.notes !== undefined) assign("notes", patch.notes);
      if (patch.status !== undefined) {
        assign("status", patch.status);
        if (patch.status === "completada") {
          fields.push("completed_at = coalesce(completed_at, now())");
        } else {
          fields.push("completed_at = null");
        }
      }

      fields.push("updated_at = now()");
      values.push(id);

      const { rowCount } = await query(
        `update tasks set ${fields.join(", ")} where id = $${index}`,
        values,
      );
      if (rowCount === 0) return null;
      return repository.findTask(id);
    },

    async deleteTask(id) {
      const { rowCount } = await query(`delete from tasks where id = $1`, [id]);
      return rowCount > 0;
    },

    async listSessions(taskId) {
      const { rows } = await query(
        `select id, task_id as "taskId", type, duration_minutes as "durationMinutes",
                started_at as "startedAt", ended_at as "endedAt"
         from pomodoro_sessions where task_id = $1 order by started_at desc`,
        [taskId],
      );
      return rows;
    },

    async createSession({ taskId, type, durationMinutes, endedAt = null }) {
      const { rows } = await query(
        `insert into pomodoro_sessions (task_id, type, duration_minutes, ended_at)
         values ($1, $2, $3, $4)
         returning id, task_id as "taskId", type, duration_minutes as "durationMinutes",
                   started_at as "startedAt", ended_at as "endedAt"`,
        [taskId, type, durationMinutes, endedAt],
      );
      return rows[0];
    },

    async stats() {
      const [{ rows: tasksByStatus }, { rows: focus }, { rows: subjects }] = await Promise.all([
        query(`select status, count(*)::int as count from tasks group by status`),
        query(
          `select count(*)::int as count, coalesce(sum(duration_minutes), 0)::int as minutes
           from pomodoro_sessions where type = 'focus'`,
        ),
        query(`select count(*)::int as count from subjects`),
      ]);

      const byStatus = { pendiente: 0, en_progreso: 0, completada: 0 };
      for (const row of tasksByStatus) byStatus[row.status] = row.count;

      return {
        subjects: subjects[0].count,
        tasksTotal: Object.values(byStatus).reduce((a, b) => a + b, 0),
        tasksByStatus: byStatus,
        focusSessions: focus[0].count,
        focusMinutes: focus[0].minutes,
      };
    },
  };

  return repository;
}

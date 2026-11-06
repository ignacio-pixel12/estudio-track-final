import { Router } from "express";

const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

export function tasksRouter(service) {
  const router = Router();

  router.get(
    "/",
    wrap(async (req, res) => {
      res.json({ data: await service.listTasks(req.query) });
    }),
  );

  router.post(
    "/",
    wrap(async (req, res) => {
      res.status(201).json({ data: await service.createTask(req.body) });
    }),
  );

  router.get(
    "/:id",
    wrap(async (req, res) => {
      res.json({ data: await service.getTask(req.params.id) });
    }),
  );

  router.patch(
    "/:id",
    wrap(async (req, res) => {
      res.json({ data: await service.updateTask(req.params.id, req.body) });
    }),
  );

  router.delete(
    "/:id",
    wrap(async (req, res) => {
      await service.deleteTask(req.params.id);
      res.status(204).send();
    }),
  );

  router.post(
    "/:id/complete",
    wrap(async (req, res) => {
      res.json({ data: await service.completeTask(req.params.id) });
    }),
  );

  router.get(
    "/:id/sessions",
    wrap(async (req, res) => {
      res.json({ data: await service.listSessions(req.params.id) });
    }),
  );

  router.post(
    "/:id/sessions",
    wrap(async (req, res) => {
      res.status(201).json({ data: await service.registerSession(req.params.id, req.body) });
    }),
  );

  return router;
}

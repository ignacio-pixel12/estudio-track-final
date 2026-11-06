import { Router } from "express";

const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

export function subjectsRouter(service) {
  const router = Router();

  router.get(
    "/",
    wrap(async (_req, res) => {
      res.json({ data: await service.listSubjects() });
    }),
  );

  router.post(
    "/",
    wrap(async (req, res) => {
      res.status(201).json({ data: await service.createSubject(req.body) });
    }),
  );

  return router;
}

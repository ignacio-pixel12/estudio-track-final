import { Router } from "express";

const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

export function statsRouter(service) {
  const router = Router();

  router.get(
    "/",
    wrap(async (_req, res) => {
      res.json({ data: await service.getStats() });
    }),
  );

  return router;
}

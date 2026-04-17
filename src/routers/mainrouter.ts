import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

router.get("/Health", (req: Request, res: Response) => {
  res.json({ message: "API 'NossoSaldo' está funcionando corretamente" });
});

export { router }
import { NextFunction, Request, Response, Router } from "express";
import {
  getAsset,
  getGlobeAssets,
  getOverhead,
  getSkyOverhead,
  getPlanetPosition,
  getObservations,
  getPasses,
  getPosition,
  getVisibilityWindows,
  listAssets,
  runSync,
} from "../controllers/orbital.controller.js";

export const orbitalRouter = Router();

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => unknown | Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(handler(req, res, next)).catch(next);

orbitalRouter.get("/assets", asyncHandler(listAssets));
orbitalRouter.get("/globe/assets", asyncHandler(getGlobeAssets));
orbitalRouter.get("/assets/:catalogNumber", asyncHandler(getAsset));
orbitalRouter.get("/assets/:catalogNumber/position", asyncHandler(getPosition));
orbitalRouter.get("/assets/:catalogNumber/passes", asyncHandler(getPasses));
orbitalRouter.get("/overhead", asyncHandler(getOverhead));
orbitalRouter.get("/sky/overhead", asyncHandler(getSkyOverhead));
orbitalRouter.get("/sky/planet/:name", asyncHandler(getPlanetPosition));
orbitalRouter.get("/observations", asyncHandler(getObservations));
orbitalRouter.get("/visibility-windows", asyncHandler(getVisibilityWindows));
orbitalRouter.post("/sync", asyncHandler(runSync));

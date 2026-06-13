import { Router } from "express";

import {
  getPosition,
} from "./orbital.controller";

export const router = Router();

router.get(
  "/assets/:catalogNumber/position",
  getPosition
);
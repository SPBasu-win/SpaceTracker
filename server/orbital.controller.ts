import { Request, Response } from "express";
import { getCurrentPosition } from "./orbital.service";

export async function getPosition(
  req: Request,
  res: Response
) {
  try {
    const catalogNumber = Number(
      req.params.catalogNumber
    );

    const data =
      await getCurrentPosition(
        catalogNumber
      );

    res.json(data);
  } catch (error) {
    res.status(404).json({
      error:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });
  }
}
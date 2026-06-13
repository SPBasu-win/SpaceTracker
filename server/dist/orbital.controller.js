"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPosition = getPosition;
const orbital_service_1 = require("./orbital.service");
async function getPosition(req, res) {
    try {
        const catalogNumber = Number(req.params.catalogNumber);
        const data = await (0, orbital_service_1.getCurrentPosition)(catalogNumber);
        res.json(data);
    }
    catch (error) {
        res.status(404).json({
            error: error instanceof Error
                ? error.message
                : "Unknown error",
        });
    }
}

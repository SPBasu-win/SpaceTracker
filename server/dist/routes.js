"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const orbital_controller_1 = require("./orbital.controller");
exports.router = (0, express_1.Router)();
exports.router.get("/assets/:catalogNumber/position", orbital_controller_1.getPosition);

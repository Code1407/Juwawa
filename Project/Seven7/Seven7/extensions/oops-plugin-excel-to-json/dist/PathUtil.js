"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveConfigPath = exports.getDefaultProjectRoot = void 0;
const path_1 = __importDefault(require("path"));
function getDefaultProjectRoot() {
    return path_1.default.resolve(__dirname, "../../..");
}
exports.getDefaultProjectRoot = getDefaultProjectRoot;
function resolveConfigPath(value, projectRoot) {
    if (value == null || value.length === 0) {
        return "";
    }
    if (path_1.default.isAbsolute(value)) {
        return path_1.default.normalize(value);
    }
    if (value.startsWith("project://")) {
        return path_1.default.join(projectRoot, value.replace("project://", ""));
    }
    return path_1.default.resolve(projectRoot, value);
}
exports.resolveConfigPath = resolveConfigPath;

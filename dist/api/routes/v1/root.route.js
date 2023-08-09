"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const root_controller_js_1 = __importDefault(require("../../controllers/root.controller.js"));
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    server.get('/status', {}, root_controller_js_1.default.status);
    server.post('/report-violation', {}, root_controller_js_1.default.report);
    done();
}
exports.default = routes;

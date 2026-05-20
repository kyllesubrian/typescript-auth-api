"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerServe = exports.swaggerRouter = void 0;
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const swaggerDocument = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, '../../swagger.json'), 'utf8'));
exports.swaggerRouter = swagger_ui_express_1.default.setup(swaggerDocument);
exports.swaggerServe = swagger_ui_express_1.default.serve;

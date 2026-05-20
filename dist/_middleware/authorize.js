"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_json_1 = __importDefault(require("../../config.json"));
const db_1 = require("../_helpers/db");
function authorize(roles = []) {
    return [
        async (req, res, next) => {
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json({ message: 'No token provided' });
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, config_json_1.default.jwtSecret);
                req.user = decoded;
                next();
            }
            catch (err) {
                return res.status(401).json({ message: 'Invalid token' });
            }
        },
        async (req, res, next) => {
            const account = await db_1.db.Account.findByPk(req.user.id);
            if (!account) {
                return res.status(401).json({ message: 'Account not found' });
            }
            const isAuthorized = roles.length === 0 || roles.includes(account.role);
            if (!isAuthorized) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            req.user.role = account.role;
            req.user.ownsToken = (tokenId) => tokenId === req.user.tokenId;
            next();
        }
    ];
}

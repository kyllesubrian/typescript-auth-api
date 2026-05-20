"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initialize = initialize;
const promise_1 = __importDefault(require("mysql2/promise"));
const sequelize_1 = require("sequelize");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
exports.db = {};
async function initialize() {
    const host = process.env.DB_HOST;
    const port = parseInt(process.env.DB_PORT || '3306');
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    const database = process.env.DB_NAME;
    const sslConfig = {
        rejectUnauthorized: true
    };
    // Use CA cert from env variable or file
    if (process.env.DB_CA_CERT) {
        sslConfig.ca = process.env.DB_CA_CERT;
    }
    else {
        const caPath = path_1.default.join(__dirname, '../../ca.pem');
        if (fs_1.default.existsSync(caPath)) {
            sslConfig.ca = fs_1.default.readFileSync(caPath);
        }
    }
    const connection = await promise_1.default.createConnection({
        host,
        port,
        user,
        password,
        ssl: sslConfig
    });
    console.log('Connected to Aiven MySQL');
    await connection.end();
    const sequelize = new sequelize_1.Sequelize(database, user, password, {
        dialect: 'mysql',
        host,
        port,
        dialectOptions: {
            ssl: sslConfig
        },
        logging: false
    });
    const { default: Account } = await Promise.resolve().then(() => __importStar(require('../accounts/account.model')));
    const { default: RefreshToken } = await Promise.resolve().then(() => __importStar(require('../accounts/refresh-token.model')));
    exports.db.Account = Account(sequelize);
    exports.db.RefreshToken = RefreshToken(sequelize);
    exports.db.Account.hasMany(exports.db.RefreshToken, { foreignKey: 'accountId', onDelete: 'CASCADE' });
    exports.db.RefreshToken.belongsTo(exports.db.Account, { foreignKey: 'accountId' });
    await sequelize.sync({ alter: true });
    console.log('Database tables synced');
}

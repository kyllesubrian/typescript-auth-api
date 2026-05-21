import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';

export const db: any = {};

export async function initialize(): Promise<void> {
    // Debug: log env vars (remove after fixing)
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_PORT:', process.env.DB_PORT);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_CA_CERT exists:', !!process.env.DB_CA_CERT);

    const host = process.env.DB_HOST!;
    const port = parseInt(process.env.DB_PORT || '3306');
    const user = process.env.DB_USER!;
    const password = process.env.DB_PASSWORD!;
    const database = process.env.DB_NAME!;

    const sslConfig: any = {
        rejectUnauthorized: true
    };

    if (process.env.DB_CA_CERT) {
        sslConfig.ca = process.env.DB_CA_CERT;
    } else {
        const caPath = path.join(__dirname, '../../ca.pem');
        if (fs.existsSync(caPath)) {
            sslConfig.ca = fs.readFileSync(caPath);
        }
    }

    const connection = await mysql.createConnection({
        host,
        port,
        user,
        password,
        ssl: sslConfig
    });

    console.log('Connected to Aiven MySQL');
    await connection.end();

    const sequelize = new Sequelize(database, user, password, {
        dialect: 'mysql',
        host,
        port,
        dialectOptions: {
            ssl: sslConfig
        },
        logging: false
    });

    const { default: Account } = await import('../accounts/account.model');
    const { default: RefreshToken } = await import('../accounts/refresh-token.model');

    db.Account = Account(sequelize);
    db.RefreshToken = RefreshToken(sequelize);

    db.Account.hasMany(db.RefreshToken, { foreignKey: 'accountId', onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account, { foreignKey: 'accountId' });

    await sequelize.sync({ alter: true });
    console.log('Database tables synced');
}
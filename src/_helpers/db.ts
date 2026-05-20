import config from '../../config.json';
import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';

export const db: any = {};

export async function initialize(): Promise<void> {
    const { host, port, user, password, database } = config.database;

    // SSL configuration for Aiven
    const sslConfig = {
        ca: fs.readFileSync(path.join(__dirname, '../../ca.pem')),
        rejectUnauthorized: true
    };

    // Test connection first
    const connection = await mysql.createConnection({ 
        host, 
        port, 
        user, 
        password,
        ssl: sslConfig
    });
    
    console.log('✅ Connected to Aiven MySQL');
    await connection.end();

    // Connect with Sequelize
    const sequelize = new Sequelize(database, user, password, { 
        dialect: 'mysql',
        host: host,
        port: port,
        dialectOptions: {
            ssl: sslConfig
        },
        logging: false
    });

    // Import models
    const { default: Account } = await import('../accounts/account.model');
    const { default: RefreshToken } = await import('../accounts/refresh-token.model');

    db.Account = Account(sequelize);
    db.RefreshToken = RefreshToken(sequelize);

    db.Account.hasMany(db.RefreshToken, { foreignKey: 'accountId', onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account, { foreignKey: 'accountId' });

    await sequelize.sync({ alter: true });
    console.log('✅ Database tables synced');
}
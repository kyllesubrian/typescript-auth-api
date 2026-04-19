import config from '../../config.json';
import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';

export const db: any = {};

export async function initialize(): Promise<void> {
    const { host, port, user, password, database } = config.database;

    const connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await connection.end();

    const sequelize = new Sequelize(database, user, password, { dialect: 'mysql', logging: false });

    const Account = require('../accounts/account.model').default(sequelize);
    const RefreshToken = require('../accounts/refresh-token.model').default(sequelize);

    db.Account = Account;
    db.RefreshToken = RefreshToken;

    db.Account.hasMany(db.RefreshToken, { foreignKey: 'accountId', onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account, { foreignKey: 'accountId' });

    await sequelize.sync({ alter: true });
    console.log('✅ Database initialized');
}
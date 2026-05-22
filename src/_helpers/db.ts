import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import { initAccount } from '../accounts/account.model';
import { initRefreshToken } from '../accounts/refresh-token.model';

const db: any = {};
export default db;

async function initialize() {
    const host = process.env.DB_HOST || 'mysql-35c123e7-vincentsubrian-0e92.a.aivencloud.com';
    const port = parseInt(process.env.DB_PORT || '12223');
    const user = process.env.DB_USER || 'avnadmin';
    const password = process.env.DB_PASSWORD || '';  // ← MUST come from environment variable!
    const database = process.env.DB_NAME || 'subrian_db';

    if (!password) {
        throw new Error('DB_PASSWORD environment variable is required!');
    }

    console.log('Connecting to DB:', { host, port, user, database });

    const connection = await mysql.createConnection({ 
        host, 
        port, 
        user, 
        password,
        ssl: { rejectUnauthorized: false }
    });

    await connection.end();

    const sequelize = new Sequelize(database, user, password, {
        host: host,
        port: port,
        dialect: 'mysql',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });

    db.Account = initAccount(sequelize);
    db.RefreshToken = initRefreshToken(sequelize);

    await sequelize.sync();
    console.log('✅ Database connected successfully!');
}

export { initialize };
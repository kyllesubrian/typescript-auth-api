import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import errorHandler from './_middleware/error-handler';
import db, { initialize } from './_helpers/db';
import accountsController from './accounts/accounts.controller';
import swaggerRouter from './_helpers/swagger';
import dotenv from 'dotenv';
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? (corsOrigin ? corsOrigin.split(',').map(x => x.trim()) : false)
        : (origin: any, callback: any) => callback(null, true),
    credentials: true
}));

app.use('/accounts', accountsController);
app.use('/api-docs', swaggerRouter);
app.use(errorHandler);

initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
        });
    })
    .catch((err: any) => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });
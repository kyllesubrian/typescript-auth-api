import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './_middleware/error-handler';
import { initialize } from './_helpers/db';
import accountsController from './accounts/accounts.controller';
import { swaggerServe, swaggerRouter } from './_helpers/swagger';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
    'http://localhost:4200',
    'https://angular-21-boilerplate-main.onrender.com'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(cookieParser());

app.use('/accounts', accountsController);
app.use('/api-docs', swaggerServe, swaggerRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });
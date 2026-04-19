import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';

const swaggerDocument = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../swagger.json'), 'utf8')
);

export const swaggerRouter = swaggerUi.setup(swaggerDocument);
export const swaggerServe = swaggerUi.serve;
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

const swaggerDocument = YAML.parse(
    fs.readFileSync(path.join(__dirname, '../../swagger.yaml'), 'utf8')
);

export const swaggerRouter = swaggerUi.setup(swaggerDocument);
export const swaggerServe = swaggerUi.serve;
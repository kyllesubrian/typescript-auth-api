import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';
import YAML from 'yamljs';

const swaggerDocument = YAML.load('./swagger.yaml');
const router = Router();

// Swagger route
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default router;
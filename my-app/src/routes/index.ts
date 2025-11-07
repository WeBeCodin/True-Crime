import { Router } from 'express';
import { SomeController } from '../controllers';

const router = Router();

router.get('/some-endpoint', SomeController.someMethod);
router.post('/another-endpoint', SomeController.anotherMethod);

export default router;
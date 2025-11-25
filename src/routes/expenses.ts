import { Router } from "express";

import * as controller from "../controllers/expenseController";
import { validateAuthorization } from "../utils/validators";

const router = Router();

router.use(validateAuthorization);

router.route('/')
    .get(controller.getExpense)
    .post(controller.createExpense)

router.route('/bulk')
    .get(controller.getExpenses)

export default router;

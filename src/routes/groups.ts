import { Router } from "express";

import * as controller from "../controllers/groupController";
import { validateAuthorization } from "../utils/validators";

const router = Router();

router.use(validateAuthorization);

router.route('/')
    .get(controller.getGroups)
    .post(controller.createGroup)

router.route('/lookup')
    .get(controller.getGroup)

export default router;

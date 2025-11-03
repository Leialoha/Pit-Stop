import { Router } from "express";
import * as controller from "../controlllers/groupController";
import { validateAuthorization } from "../utils/validators";

const router = Router();

router.use(validateAuthorization);

router.route('/')
    .get(controller.getGroups)
    .post(controller.createGroup)

export default router;

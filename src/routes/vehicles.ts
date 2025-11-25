import { Router } from "express";

import * as controller from "../controllers/vehicleController";
import { validateAuthorization } from "../utils/validators";

const router = Router();

router.use(validateAuthorization);

router.route('/')
    .get(controller.getVehicle)
    .post(controller.createVehicle)

router.route('/vin')
    .get(controller.getVINDetails)

export default router;

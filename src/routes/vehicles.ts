import { Router } from "express";
import * as controller from "../controlllers/vehicleController";
import { validateAuthorization } from "../utils/validators";

const router = Router();

router.use(validateAuthorization);

router.route('/')
    .post(controller.createVehicle)

router.route('/lookup')
    .get(controller.getVehicle)

router.route('/vin')
    .get(controller.getVINDetails)

export default router;

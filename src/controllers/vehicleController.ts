import { Request, Response } from "express";
import { Types } from "mongoose";

import * as LANG from "../constants/lang";
import { IVehicle, VehicleModel } from "../database";
import { lookupGroupById, lookupVehicleById } from "../database/lookup";
import { sendClientError, sendStatus } from "../utils";
import { validateContents, validateVIN } from "../utils/validators";

/**
 * @desc    Create a vehicle
 * @route   POST /api/vehicles/
 */
export async function createVehicle(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const phone = req.headers['X-Phone'] as string;

    const validKeys = ['name', 'make', 'model', 'year', 'vin', 'plate', 'group'];
    let { isValid, contents, unallowedKeys } = validateContents(req.body, validKeys);
    if (!isValid) return sendClientError(res, LANG.INVALID_PARAMETERS_EXTRA_KEYS(unallowedKeys));
    const { name, make, model, year, vin, plate: licensePlate, group } = contents;

    const hasAll = make && model && year && group;
    if (!hasAll) return sendStatus(res, 400);

    const groupID = Types.ObjectId.createFromHexString(group);
    const hasGroup: boolean = await lookupGroupById(group, phone)
        .then(group => group != null)
        .catch(() => false);

    if (!hasGroup) return sendStatus(res, 404);
    const vehicle: IVehicle = await VehicleModel.create({ name, make, model, year, vin, licensePlate, groupID });
    return res.json(vehicle);
}

/**
 * @desc    Get the list of the user's groups
 * @route   GET /api/vehicles/lookup
 */
export async function getVehicle(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const phone = req.headers['X-Phone'] as string;
    const { id: idStr } = req.query as { id: string };
    const vehicle = await lookupVehicleById(idStr, phone);

    if (vehicle) res.json(vehicle);
    else sendStatus(res, 404);
}

/**
 * @desc    Get vehicle details by VIN
 * @route   PATCH /api/vehicles/vin
 */
export async function getVINDetails(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const phone = req.headers['X-Phone'] as string;
    const { query } = req.query as { query: string };

    const { isValid, make, model, year } = await validateVIN(query as string);
    if (!isValid) return sendStatus(res, 400);

    return res.json({ make, model, year });
}

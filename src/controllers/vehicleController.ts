import { Request, Response } from "express";
import { Types } from "mongoose";

import * as LANG from "../constants/lang";
import { IVehicle, VehicleModel } from "../database";
import { lookupGroupById, lookupVehicleById } from "../database/lookup";
import { sendClientError, sendStatus } from "../utils";
import { requireContents, validateContents, validateVIN } from "../utils/validators";

/**
 * @desc    Create a vehicle
 * @route   POST /api/vehicles/
 */
export async function createVehicle(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const phone = req.headers['X-Phone'] as string;

    const requiredKeys = ['group', 'make', 'model', 'year' ];
    const allowedKeys = [...requiredKeys, 'name', 'vin', 'plate' ];

    // Enforce required keys
    const { isValid: hasRequired, missingKeys } = requireContents(req.body, requiredKeys);
    if (!hasRequired) return sendClientError(res, LANG.INVALID_PARAMETERS_MISSING_KEYS(missingKeys));

    // Validate contents
    const { isValid, contents, unallowedKeys } = validateContents(req.body, allowedKeys);
    if (!isValid) return sendClientError(res, LANG.INVALID_PARAMETERS_EXTRA_KEYS(unallowedKeys));

    // Let's extract all the fields
    const { name, make, model, year, vin, plate: licensePlate, group } = contents;

    const hasGroup: boolean = (await lookupGroupById(group, phone)) !== null;
    if (!hasGroup) return sendClientError(res, LANG.GROUP_NOT_FOUND);
    
    // Create the required ObjectIds
    const groupID = Types.ObjectId.createFromHexString(group);

    const vehicle = await VehicleModel.create({
        groupID, name, make, model, year, vin, licensePlate
    });

    return res.json(vehicle);
}

/**
 * @desc    Get the list of the user's groups
 * @route   GET /api/vehicles
 */
export async function getVehicle(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const phone = req.headers['X-Phone'] as string;
    const { id: idStr } = req.query as { id: string };
    const vehicle = await lookupVehicleById(idStr, phone);

    if (vehicle) res.json(vehicle);
    else sendClientError(res, LANG.VEHICLE_NOT_FOUND, 404);
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

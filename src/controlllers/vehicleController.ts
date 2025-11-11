import { Request, Response } from "express";
import { Types } from "mongoose";
import { IVehicle, VehicleModel } from "../database";
import { sendStatus } from "../utils";
import { lookupGroupById, lookupVehicleById } from "../database/lookup";
import { validateVIN } from "../utils/validators";


/**
 * @desc    Get the list of the user's groups
 * @route   GET /api/vehicles/lookup
 */
export async function getVehicle(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const phone = req.headers['X-Phone'] as string;
    const { id: idStr } = req.query as { id: string };
    const vehicle = lookupVehicleById(idStr, phone);

    if (vehicle) res.json(vehicle);
    else sendStatus(res, 404);
}

/**
 * @desc    Create a vehicle
 * @route   POST /api/vehicles/
 */
export async function createVehicle(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const phone = req.headers['X-Phone'] as string;

    let { name, make, model, year, vin, plate: licensePlate, group } = req.body;

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

// $year $make $model $trim

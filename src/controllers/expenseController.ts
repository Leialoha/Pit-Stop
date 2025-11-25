import { Request, Response } from "express";
import { Types } from "mongoose";

import * as LANG from "../constants/lang";
import { ExpenseRecordModel } from "../database";
import { lookupExpenseById, lookupExpenses, lookupVehicleById } from "../database/lookup";
import { sendClientError } from "../utils";
import { requireContents, validateContents } from "../utils/validators";


/**
 * @desc    Create a vehicle expense
 * @route   POST /api/expenses/
 */
export async function createExpense(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const phone = req.headers['X-Phone'] as string;

    const requiredKeys = ['vehicle', 'vendor', 'category', 'description', 'totalCost'];
    const allowedKeys = [...requiredKeys, 'attachment', 'odometer', 'dateOfRecord', 'wasService', 'paymentMethod', 'warrantyInfo', 'quantity'];

    // Enforce required keys
    const { isValid: hasRequired, missingKeys } = requireContents(req.body, requiredKeys);
    if (!hasRequired) return sendClientError(res, LANG.INVALID_PARAMETERS_MISSING_KEYS(missingKeys));

    // Validate contents
    const { isValid, contents, unallowedKeys } = validateContents(req.body, allowedKeys);
    if (!isValid) return sendClientError(res, LANG.INVALID_PARAMETERS_EXTRA_KEYS(unallowedKeys));

    // Let's extract all the fields
    const {
        vehicle, attachment, odometer, dateOfRecord: dateOfRecordStr, vendor, wasService,
        category, description, totalCost, paymentMethod, warrantyInfo, quantity
    } = contents;
    
    const hasVehicle = (await lookupVehicleById(vehicle, phone)) !== null;
    if (!hasVehicle) return sendClientError(res, LANG.VEHICLE_NOT_FOUND);

    // Create the required ObjectIds
    const vehicleID = Types.ObjectId.createFromHexString(vehicle);
    const attachmentID = attachment ? Types.ObjectId.createFromBase64(attachment) : undefined;
    const dateOfRecord = dateOfRecordStr ? new Date(dateOfRecordStr) : undefined;

    const expense = await ExpenseRecordModel.create({
        vehicleID, attachmentID, odometer, dateOfRecord,
        vendor, wasService, category, description, totalCost,
        paymentMethod, warrantyInfo, quantity
    });

    res.json(expense);
}

/**
 * @desc    Get a vehicle expense
 * @route   GET /api/expenses/
 */
export async function getExpense(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const phone = req.headers['X-Phone'] as string;

    const { id: idStr } = req.query as { id: string };
    const expense = await lookupExpenseById(idStr, phone);

    if (expense) res.json(expense);
    else sendClientError(res, LANG.EXPENSE_NOT_FOUND, 404);
}

/**
 * @desc    Get a list of vehicle expenses
 * @route   GET /api/expenses/bulk
 */
export async function getExpenses(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const phone = req.headers['X-Phone'] as string;

    const { vehicle: vehicleStr } = req.query as { vehicle: string };
    const vehicle = /^[\da-f]{24}$/i.test(vehicleStr || '') ? vehicleStr : null;

    const expenses = await lookupExpenses( phone );

    res.json(expenses);
}

/**
 * @desc    Delete a vehicle expense
 * @route   DELETE /api/expenses/
 */
export async function deleteExpense(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const phone = req.headers['X-Phone'] as string;
}



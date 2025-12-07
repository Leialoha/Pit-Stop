import { Request, Response } from "express";

import * as LANG from "../constants/lang";
import { GroupModel, GroupUser, IGroup } from "../database";
import { fillGroups, findUsers, lookupGroupById, lookupGroups } from "../database/lookup";
import { randomName, sendClientError } from "../utils";
import { validateContents, validatePhoneNumber } from "../utils/validators";

/**
 * @desc    Get a user's group by a lookup
 * @route   GET /api/groups
 */
export async function getGroup(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const phone = req.headers['X-Phone'] as string;
    const { id: idStr } = req.query as { id: string };
    const group = await lookupGroupById(idStr, phone);

    if (group) res.json(group);
    else sendClientError(res, LANG.GROUP_NOT_FOUND, 404);
}

/**
 * @desc    Create a new group
 * @route   POST /api/groups
 */
export async function createGroup(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const phone = req.headers['X-Phone'] as string;

    const { isValid, contents, unallowedKeys } = validateContents(req.body, ['name', 'phones']);
    if (!isValid) return sendClientError(res, LANG.INVALID_PARAMETERS_EXTRA_KEYS(unallowedKeys));

    // Let's extract all the fields
    const name = contents.name ?? randomName();
    const phones = validatePhones(contents.phones ?? []);
    phones.push(phone); // Ensure the creator is added

    // Let's create user references
    const users = (await findUsers(phones))
        .map(ref => ({...ref, permissions: 0b001}) as GroupUser);

    const group: IGroup = await GroupModel.create({ name, users });
    res.json(group);
}

/**
 * @desc    Get the list of the user's groups
 * @route   GET /api/groups/bulk
 */
export async function getGroups(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const phone = req.headers['X-Phone'] as string;
    await fillGroups(phone);

    const groups = await lookupGroups(phone);
    res.json(groups);
}

// Utility functions

function validatePhones(phone: string[]) {
    return phone.map(validatePhoneNumber)
        .filter(val => val.isValid)
        .map(val => val.phone);
}

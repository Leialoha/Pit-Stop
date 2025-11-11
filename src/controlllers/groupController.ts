import { Request, Response } from "express";
import { GroupModel, GroupUsers, IGroup } from "../database";
import { randomName } from "../utils";
import { validatePhoneNumber } from "../utils/validators";
import { fillGroups, findUsers, lookupGroups } from "../database/lookup";


/**
 * @desc    Get the list of the user's groups
 * @route   GET /api/groups
 */
export async function getGroups(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const phone = req.headers['X-Phone'] as string;
    await fillGroups(phone);

    const groups = await lookupGroups(phone);
    res.json(groups);
}

/**
 * @desc    Create a new group
 * @route   POST /api/groups
 */
export async function createGroup(req: Request, res: Response) {
    const name = req.body.name || randomName();
    const phones = validatePhones(req.body.phones || []);

    // This is an internal header (look at utils/validators.ts)
    phones.push(req.headers['X-Phone'] as string);
    const users = (await findUsers(phones))
        .map(ref => ({...ref, permissions: 0b001}) as GroupUsers);

    const group: IGroup = await GroupModel.create({ name, users });
    res.json(group);
}






function validatePhones(phone: string[]) {
    return phone.map(validatePhoneNumber)
        .filter(val => val.isValid)
        .map(val => val.phone);
}

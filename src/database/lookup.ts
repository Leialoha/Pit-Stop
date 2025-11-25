import { Types } from "mongoose";

import { IExpenseRecord, IGroup, IUser, IVehicle, UserReference } from "./interfaces";
import { GroupModel, UserModel } from "./schemas";
import { validatePhoneNumber } from "../utils/validators";

function filterExistingUsersByPhone(phones: string[]) {
    return { $match: { phone: { $in: phones } } };
}

function filterGroupsByPhone() {
    return matchInArray('$user.phone', '$group.users.phone');
}

function getUserReferences(phones: string[]) {
    return [
        limit(),
        replaceRoot({ phones }),
        unwindBy('$phones'),
        { $lookup: {
            from: "users",
            let: { phone: '$phones' },
            pipeline: [
                { $match: { $expr: {
                    $eq: [ "$$phone", "$phone" ]
                } } }
            ],
            as: "user"
        } },
        unwindBy('$user'),
        { $replaceWith: {
            phone: { $cond: {
                if: "$user",
                then: null,
                else: "$phones"
            } },
            userID: { $cond: {
                if: "$user",
                then: { $getField: {
                    field: "_id",
                    input: "$user"
                } },
                else: null
            } }
        } }
    ];
}

function lookupGroupsByUser() {
    return [
        replaceRoot({ user: "$$ROOT" }),
        { $lookup: {
            from: "groups",
            let: {
                userID: "$user._id",
                phone: "$user.phone"
            },
            pipeline: [
                { $match: { $expr: {
                    $or: [
                        { $in: [ "$$userID", "$users.userID" ] },
                        { $in: [ "$$phone", "$users.phone" ] }
                    ]
            } } }
            ],
            as: "group"
        } },
        unwindBy('$group')
    ];
}

function fetchVehiclesByGroup() {
    return { $lookup: {
        from: "vehicles",
        localField: 'group._id',
        foreignField: 'groupID',
        as: "vehicle"
    } };
}

function fetchExpensesByVehicle() {
    return { $lookup: {
        from: "expenses",
        localField: 'vehicle._id',
        foreignField: 'vehicleID',
        as: "expense"
    } };
}

function lookupVehiclesByGroup() {
    return [
        fetchVehiclesByGroup(),
        unwindBy('$vehicle')
    ];
}

function lookupExpensesByVehicle() {
    return [
        fetchExpensesByVehicle(),
        unwindBy('$expense')
    ];
}

function getGroupPermissions() {
    return [
        { $set: { permission: '$group.users' } },
        unwindBy('$permission')
    ]
}

function updatePermissionReference() {
    return [
        { $set: {
            permission: { $cond: {
                if: { $eq: [ '$user.phone', '$permission.phone' ] },
                then: { $mergeObjects: [
                    '$permission',
                    { userID: '$user._id', phone: null }
                ] },
                else: '$permission'
            } }
        } },
        { $group: {
            _id: '$group._id',
            users: { $push: "$permission" }
        } }
    ]
}

// Expressions
function matchById(_id: Types.ObjectId) {
    return { $match: { _id } };
}

function matchInArray(element: string, array: string) {
    return { $match: { $expr: { $in: [ element, array ] } } };
}

function limit(amount: number = 1) {
    return { $limit: amount };
}

function unwindBy(path: string) {
    return { $unwind: { path } };
}

function replaceRoot(newRoot: string | object = '$$ROOT') {
    return { $replaceRoot: { newRoot } };
}

// Grouped Calls
export async function findUsers(phonesStr: string[]): Promise<UserReference[]> {
    const phones = phonesStr.map(validatePhoneNumber)
        .filter(ref => ref.isValid).map(ref => ref.phone);

    console.log(phonesStr, phones);

    if (phones.length == 0) return [];

    return await UserModel.aggregate(getUserReferences( phones ));
}

export async function lookupUser(phoneOrIdStr: string): Promise<IUser> {
    const phoneStr = phoneOrIdStr.trim();
    const { isValid, phone } = validatePhoneNumber(phoneStr);

    // Let's see if it's an ID first
    if (phoneStr.length == 24 && /^[\da-f]+$/gi.test(phoneStr)) {
        const _id = Types.ObjectId.createFromHexString(phoneStr);
        return await UserModel.findOne({ _id });
    } else if (!isValid) return null;

    // If the number is invalid, return null
    // Otherwise, lookup by phone number
    return await UserModel.findOne({ phone });
}

export async function fillGroups(phoneStr: string) {
    const { isValid, phone} = validatePhoneNumber(phoneStr);
    if (!isValid) return [];

    const groups = await GroupModel.aggregate([
        matchInArray(phone, '$users.phone')
    ]);

    if (groups.length = 0) return;

    await UserModel.aggregate([
        filterExistingUsersByPhone([ phone ]),
        ...lookupGroupsByUser(),
        filterGroupsByPhone(),
        ...getGroupPermissions(),
        ...updatePermissionReference(),
        { $merge: {
            into: 'groups',
            on: '_id',
            whenMatched: 'merge',
            whenNotMatched: 'discard'
        } }
    ]);
}

export async function lookupGroups(phoneStr: string): Promise<IGroup[]> {
    const { isValid, phone} = validatePhoneNumber(phoneStr);
    if (!isValid) return [];

    return await UserModel.aggregate([
        filterExistingUsersByPhone([ phone ]),
        ...lookupGroupsByUser(),
        replaceRoot('$group')
    ]);
}

export async function lookupGroupById(id: string, phoneStr: string): Promise<IGroup> {
    const _id = Types.ObjectId.createFromHexString(id);
    const { isValid, phone} = validatePhoneNumber(phoneStr);
    if (!isValid) return null;

    return (await UserModel.aggregate([
        filterExistingUsersByPhone([ phone ]),
        ...lookupGroupsByUser(),
        fetchVehiclesByGroup(),
        { $set: { group: { $mergeObjects: ['$group', { vehicles: '$vehicle' }] } } },
        replaceRoot('$group'),
        matchById(_id)
    ]))[0];
}

export async function lookupVehicles(phoneStr: string): Promise<IVehicle[]> {
    const { isValid, phone} = validatePhoneNumber(phoneStr);
    if (!isValid) return [];

    return await UserModel.aggregate([
        filterExistingUsersByPhone([ phone ]),
        ...lookupGroupsByUser(),
        ...lookupVehiclesByGroup(),
        replaceRoot('$vehicle')
    ]);
}

export async function lookupVehicleById(id: string, phoneStr: string): Promise<IVehicle> {
    const _id = Types.ObjectId.createFromHexString(id);
    const { isValid, phone} = validatePhoneNumber(phoneStr);
    if (!isValid) return null;

    return (await UserModel.aggregate([
        filterExistingUsersByPhone([ phone ]),
        ...lookupGroupsByUser(),
        ...lookupVehiclesByGroup(),
        replaceRoot('$vehicle'),
        matchById(_id)
    ]))[0];
}

export async function lookupExpenses(phoneStr: string): Promise<IExpenseRecord[]> {
    const { isValid, phone } = validatePhoneNumber(phoneStr);
    if (!isValid) return [];

    return await UserModel.aggregate([
        filterExistingUsersByPhone([ phone ]),
        ...lookupGroupsByUser(),
        ...lookupVehiclesByGroup(),
        ...lookupExpensesByVehicle(),
        replaceRoot('$expense')
    ]);
}

export async function lookupExpenseById(id: string, phoneStr: string): Promise<IExpenseRecord> {
    const _id = Types.ObjectId.createFromHexString(id);
    const { isValid, phone} = validatePhoneNumber(phoneStr);
    if (!isValid) return null;

    return (await UserModel.aggregate([
        filterExistingUsersByPhone([ phone ]),
        ...lookupGroupsByUser(),
        ...lookupVehiclesByGroup(),
        ...lookupExpensesByVehicle(),
        replaceRoot('$expense'),
        matchById(_id)
    ]))[0];
}

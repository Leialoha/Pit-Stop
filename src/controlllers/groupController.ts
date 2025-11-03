import { Request, Response } from "express";
import { GroupModel, GroupUsers, IGroup, UserModel, UserReference } from "../database";
import { randomName } from "../utils";
import { Some } from "../types";
import { validatePhoneNumber } from "../utils/validators";


/**
 * @desc    Get the list of the user's groups
 * @route   GET /api/groups
 */
export async function getGroups(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const phone = req.headers['X-Phone'] as string;
    await updateMissingUsers(phone);

    const groups: IGroup[] = await GroupModel.aggregate([
        { $lookup: {
            from: "users",
            let: { phone },
            pipeline: [
                { $match: { $expr: { $eq: ["$$phone", "$phone"] } } }
            ],
            as: "matchedUser"
        } },
        { $match: { $expr: { 
            $in: [
                { $arrayElemAt: [ "$matchedUser._id", 0 ] },
                "$users.userId"
            ] 
        } } },
        { $unset: "matchedUser" }
    ]);

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

    const references = await UserModel.aggregate([
        { $limit: 1, },
        { $replaceRoot: { newRoot: { phones } } },
        { $unwind: { path: "$phones" } },
        { $lookup: {
            from: "users",
            let: { phone: "$phones" },
            pipeline: [
                { $match: { $expr: { $eq: ["$phone", "$$phone"] } } }
            ],
            as: "users",
        } },
        { $replaceWith: {
            phone: { $cond: {
                if: { $first: "$users" },
                then: null, else: "$phones",
            } },
            userId: { $cond: {
                if: { $first: "$users" },
                then: { $getField: {
                    field: "_id",
                    input: { $first: "$users" }
                } }, else: null,
            } }
        } }
    ]).then(data => data as UserReference[]);

    const users = references.map(ref => ({...ref, permissions: 0b001}) as GroupUsers);

    console.log({ name, users })
    const group: IGroup = await GroupModel.create({ name, users });

    res.json(group);
}






function validatePhones(phone: string[]) {
    return phone.map(validatePhoneNumber)
        .filter(val => val.isValid)
        .map(val => val.phone);
}

async function updateMissingUsers(phone: string) {
    await GroupModel.aggregate([
        { $lookup: {
            from: "users",
            let: { phone },
            pipeline: [
                { $match: { $expr: { $eq: ["$$phone", "$phone"] } } }
            ],
            as: "matchedUser"
        } },
        { $match: {
            $or: [
                { $expr: { $in: [ { $arrayElemAt: [ "$matchedUser.phone", 0 ] }, "$users.phone" ] } },
                { $expr: { $in: [ { $arrayElemAt: [ "$matchedUser._id", 0 ] }, "$users.userId" ] } }
            ]
        } },
        { $unwind: { path: "$users" } },
        {
            $lookup: {
                from: "users",
                let: { phone: "$users.phone" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$$phone", "$phone"] } } }
                ],
                as: "matchedUser"
            }
        },
        {
            $set: {
                users: { $cond: {
                    if: { $eq: [ { $size: "$matchedUser" }, 1 ] },
                    then: { $mergeObjects: [
                        "$users",
                        {
                            userId: { $arrayElemAt: [ "$matchedUser._id", 0 ] },
                            phone: null,
                        }
                    ] },
                    else: "$users",
                } }
            }
        },
        { $unset: "matchedUser" },
        { $group: {
            _id: "$_id",
            doc: { $first: "$$ROOT" },
            users: { $push: "$users" }
        } },
        { $replaceRoot: {
            newRoot: { $mergeObjects: [ "$doc", { users: "$users" } ] }
        } },
        { $merge: {
            into: 'groups',
            on: '_id',
            whenMatched: "merge",
            whenNotMatched: "discard"
        } }
    ]);
}



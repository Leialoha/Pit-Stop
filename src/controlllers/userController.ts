import { Request, Response } from 'express';
import { IUser, UserModel } from '../database';
import { validateEmail, validatePhoneNumber } from '../utils/validators';
import { sendClientError, sendStatus, systemTime } from '../utils';
import { BinaryLike, createHash, randomInt } from 'crypto';

import { OTP_TIMEOUT } from '../constants/system';
import * as LANG from '../constants/lang';
import { generateClientSession } from '../utils/session';
import { Types } from 'mongoose';

type TempUser = Partial<IUser> & {
    hash: string,
    exists: boolean
};

type TempUserOTP = {
    code: string;
    expires: number;
}

const tempUsers: { [key: string]: TempUser; } = {}
const tempUserOtps: { [key: string]: TempUserOTP; } = {}

/**
 * @desc    Get a single user by phone number
 * @route   GET /api/users/:id
 */
export async function getUserById(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const phone = req.headers['X-Phone'] as string;

    const _id = Types.ObjectId.createFromHexString(req.params.id);
    const lookup: IUser = await UserModel.findOne({ _id });

    if (res) {
        if (phone != lookup.phone) {
            lookup.phone = lookup.phone.replace(/\d(?=\d{4})/gi, '*');
            lookup.email = lookup.email.replace(/(?<!^|[@])\w+(?![^.]*$|[@])/gi, '***');
        }

        res.json(lookup);
    } else sendStatus(res, 404);
}

/**
 * @desc    Prep login for user
 * @route   GET /api/users/:number/login
 */
export async function requestLogin(req: Request, res: Response) {
    const { isValid, phone } = validatePhoneNumber(req.params.number as string);
    if (!isValid) return sendClientError(res, LANG.INVALID_PHONE_NUMBER);

    let partialUser: TempUser;
    const hash = quickHash( phone );

    if (tempUserOtps[hash] != null) {
        // The 403 is for an internal test if we get another request elsewhere.
        // This shouldn't happen unless from another "shared" device.
        // I don't anticipate this happening often, if ever.
        
        let { expires } = tempUserOtps[hash];
        if (expires > systemTime(OTP_TIMEOUT - 15))
            return sendClientError(res, LANG.TOO_MANY_REQUESTS, 403);
    }

    if (tempUsers[hash] == null) {
        partialUser = await UserModel.findOne({ phone })
            .then(user => (user == null ? { phone } : user) as IUser)
            .then(user => ({ ...user, hash, exists: user._id != null } as TempUser))

        if (!partialUser.exists)
            tempUsers[hash] = partialUser;
    } else partialUser = tempUsers[hash];

    tempUserOtps[hash] = {
        expires: systemTime(OTP_TIMEOUT),
        code: randomInt(100000, 999999).toString()
    }

    console.log(tempUserOtps[hash]);
    sendStatus(res, partialUser.exists ? 200 : 201);
}


/**
 * @desc    Login to a user
 * @route   POST /api/users/:number/login
 */
export async function validateLogin(req: Request, res: Response) {
    const { code, email: emailStr, name } = req.body;

    const { isValid: isValidEmail, email } = validateEmail(emailStr);
    const { isValid: isValidPhone, phone } = validatePhoneNumber(req.params.number as string);

    if (!isValidPhone) return sendClientError(res, LANG.INVALID_PHONE_NUMBER);
    if (!isValidEmail && emailStr) return sendClientError(res, LANG.INVALID_EMAIL_ADDRESS);

    const hash = quickHash( phone );
    const { code: OTP_CODE, expires: OTP_EXPIRES } = getOtp(hash);

    if (OTP_EXPIRES <= systemTime()) return sendClientError(res, LANG.INVALID_OTP_CODE)
    else if (OTP_CODE != code) return sendClientError(res, LANG.INVALID_OTP_CODE);

    if (tempUsers[hash] != null) {
        let user = await UserModel.create({ name, phone, email })
            .catch((err) => sendClientError(res, err?.message || `${err}`, 500));

        delete tempUsers[hash];
        if (user == null) return;
    }

    generateClientSession(req, phone);
    sendStatus(res, 200);
}






function getOtp(hash: string) {
    const data = tempUserOtps[hash];
    delete tempUserOtps[hash];
    return data || { code: null, expires: 0 };
}

function quickHash(data: BinaryLike) {
    return createHash('md5')
        .update(data)
        .digest('hex');
}


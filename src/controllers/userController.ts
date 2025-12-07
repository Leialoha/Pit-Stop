import { BinaryLike, createHash, randomInt } from 'crypto';
import { Request, Response } from 'express';

import * as LANG from '../constants/lang';
import { OTP_TIMEOUT } from '../constants/system';
import { IUser, TempUser, UserLookup, UserModel } from '../database';
import { lookupUser } from '../database/lookup';
import { sendClientError, sendStatus, systemTime } from '../utils';
import { generateClientSession } from '../utils/session';
import { validateContents, validateEmail, validateName, validatePhoneNumber } from '../utils/validators';
import { DatabaseLookup } from '../features/dal';


type TempUserOTP = {
    code: string;
    expires: number;
}

const tempUsers: { [key: string]: TempUser; } = {}
const tempUserOtps: { [key: string]: TempUserOTP; } = {}

/**
 * @desc    Get the current user's info
 * @route   GET /api/users/self
 */
export async function getSelf(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const phone = req.headers['X-Phone'] as string;

    const user = await lookupUser( phone );
    if (user == null) return sendClientError(res, LANG.USER_NOT_FOUND, 404);

    res.json(user);
}

/**
 * @desc    Get a single user by phone number
 * @route   GET /api/users
 */
export async function getUser(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const selfPhone = req.headers['X-Phone'] as string;
    const { phone: phoneStr, id: idStr } = req.query as { [key: string]: string };

    const id = /^[\da-f]{24}$/i.test(idStr || '') ? idStr : null;
    const phone = validatePhoneNumber(phoneStr as string).isValid ? phoneStr : null;

    const lookup = await DatabaseLookup()
        .withSelf({ phone: selfPhone, userID: null })
        .findUser({ phone: phone, userID: id })
        // TODO: Currently if no user is found, no element is returned.
        // An "abstract" user should be returned to keep privacy intact.
        // There should be no indicator if the user exists or not.
        .createFake()
        .maskDetails()
        .hideDetails()
        .removeLookupDetails();

    res.json(lookup);
}

/**
 * @desc    Prep login for user
 * @route   GET /api/users/:number/login
 */
export async function requestLogin(req: Request, res: Response) {
    const { isValid, phone } = validatePhoneNumber(req.params.number as string);
    if (!isValid) return sendClientError(res, LANG.INVALID_PHONE_NUMBER);

    const hash = quickHash( phone );

    if (tempUserOtps[hash] != null) {
        // The 403 is for an internal test if we get another request elsewhere.
        // This shouldn't happen unless from another "shared" device.
        // I don't anticipate this happening often, if ever.
        
        let { expires } = tempUserOtps[hash];
        if (expires > systemTime(OTP_TIMEOUT - 15))
            return sendClientError(res, LANG.TOO_MANY_REQUESTS, 403);
    }

    const tempUser =
        // Load from temp cache if exists
        tempUsers[hash] ?? 
        // Otherwise, lookup from DB
        await DatabaseLookup()
            .withSelf({ phone, userID: null })
            .getSelf()
            .asTempUser()
            .removeLookupDetails();

    tempUserOtps[hash] = {
        expires: systemTime(OTP_TIMEOUT),
        code: randomInt(100000, 999999).toString()
    }

    console.log(tempUserOtps[hash]);
    sendStatus(res, tempUser.exists ? 200 : 201);
}


/**
 * @desc    Login to a user
 * @route   POST /api/users/:number/login
 */
export async function validateLogin(req: Request, res: Response) {
    // Validate phone number before anything else
    const { isValid: isValidPhone, phone } = validatePhoneNumber(req.params.number as string);
    if (!isValidPhone) return sendClientError(res, LANG.INVALID_PHONE_NUMBER);

    const hash = quickHash( phone );
    const userExists = tempUsers[hash] == null;
    const { code: OTP_CODE, expires: OTP_EXPIRES } = getOtp(hash);
    let userId: string = tempUsers[hash]?._id?.toHexString()

    // Determine which fields to validate based on user existence
    const fieldsToValidate = userExists ? ['code'] : ['code', 'email', 'name'];

    // Validate body contents
    const { isValid, contents, unallowedKeys } = validateContents(req.body, fieldsToValidate);
    if (!isValid) return sendClientError(res, LANG.INVALID_PARAMETERS_EXTRA_KEYS(unallowedKeys));

    // Validate OTP code
    const { code, email: emailStr, name: nameStr } = contents;
    if (typeof code !== 'string' || !/^\d{6}$/.test(code.trim()))
        return sendClientError(res, LANG.INVALID_OTP_CODE);

    if (OTP_EXPIRES <= systemTime()) return sendClientError(res, LANG.INVALID_OTP_CODE)
    else if (OTP_CODE != code) return sendClientError(res, LANG.INVALID_OTP_CODE);

    // If new user, validate email and create user
    if (!userExists) {
        const { isValid: isValidEmail, email } = validateEmail(emailStr);
        if (!isValidEmail) return sendClientError(res, LANG.INVALID_EMAIL_ADDRESS);

        // Validate user's name
        const { isValid: isValidName, name, reason } = validateName(nameStr);

        if (!isValidName) {
            if (reason == 'empty')
                return sendClientError(res, LANG.INVALID_FIELD('Name cannot be empty'));
            if (reason == 'too_short')
                return sendClientError(res, LANG.INVALID_FIELD('Name too short (min 3 characters)'));
            if (reason == 'too_long')
                return sendClientError(res, LANG.INVALID_FIELD('Name too long (max 50 characters)'));
            return sendClientError(res, LANG.INVALID_FIELD('Name is invalid'));
        }

        let user: IUser = await UserModel.create({ name, phone, email })
            .catch((err) => sendClientError(res, err?.message || `${err}`, 500));

        delete tempUsers[hash];
        if (user == null) return;
        userId = user._id.toHexString();
    }

    generateClientSession(req, phone, userId);
    sendStatus(res, 200);
}

// Utility functions

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

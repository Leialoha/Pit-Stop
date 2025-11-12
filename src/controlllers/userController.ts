import { Request, Response } from 'express';
import { IUser, UserModel } from '../database';
import { validateContents, validateEmail, validateName, validatePhoneNumber } from '../utils/validators';
import { sendClientError, sendStatus, systemTime } from '../utils';
import { BinaryLike, createHash, randomInt } from 'crypto';

import { OTP_TIMEOUT } from '../constants/system';
import * as LANG from '../constants/lang';
import { generateClientSession } from '../utils/session';
import { lookupUser } from '../database/lookup';

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
 * @route   GET /api/users/lookup
 */
export async function getUser(req: Request, res: Response) {
    // This is an internal header (look at utils/validators.ts)
    const selfPhone = req.headers['X-Phone'] as string;
    const { phone: phoneStr, id: idStr } = req.query as { [key: string]: string };

    const id = /^[\da-f]{24}$/i.test(idStr || '') ? idStr : null;
    const phone = validatePhoneNumber(phoneStr as string).isValid ? phoneStr : null;
    const lookupBy = (phone ?? id)?.trim();

    // If no valid lookup provided, return 400
    if (!lookupBy) return sendClientError(res, LANG.INVALID_USER_REFERENCE);

    const lookup = await new Promise<IUser>(async (resolve) => {
        const result = await lookupUser(lookupBy);
        if (!result || result.phone == selfPhone) return resolve(result);

        result.phone = result.phone.replace(/\d(?=\d{4})/gi, '*');
        result.email = result.email.replace(/(?<!^|[@])\w+(?![^.]*$|[@])/gi, '***');
        resolve(result);
    });

    const anonymousUser: Partial<IUser> = { name: 'Anonymous User', phone: null, email: null, _id: null };

    // If lookup is self, return full user object
    // If lookup is by ID, return the masked user object
    // If lookup is by phone and not self, return anonymous user

    // We want to avoid leaking personal info via phone lookups
    // While IDs are less accessible, we can return full info there

    if (lookup?.phone == selfPhone) return res.json(lookup);
    if (!lookup || lookupBy == phone) return res.json(anonymousUser);
    res.json(lookup);
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
        partialUser = await lookupUser( phone )
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
    // Validate phone number before anything else
    const { isValid: isValidPhone, phone } = validatePhoneNumber(req.params.number as string);
    if (!isValidPhone) return sendClientError(res, LANG.INVALID_PHONE_NUMBER);
    
    const hash = quickHash( phone );
    const userExists = tempUsers[hash] == null;
    const { code: OTP_CODE, expires: OTP_EXPIRES } = getOtp(hash);

    // Determine which fields to validate based on user existence
    const fieldsToValidate = userExists ? ['code'] : ['code', 'email', 'name'];

    // Validate body contents
    const { isValid, contents, unallowedKeys } = validateContents(req.body, fieldsToValidate);
    if (!isValid) return sendClientError(res, LANG.INVALID_PARAMETERS_EXTRA_KEYS(unallowedKeys));

    // Validate OTP code
    const { code, email: emailStr, name: nameStr } = contents;
    if (typeof code !== 'string' || code.trim().length == 0)
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

        let user = await UserModel.create({ name, phone, email })
            .catch((err) => sendClientError(res, err?.message || `${err}`, 500));

        delete tempUsers[hash];
        if (user == null) return;
    }

    generateClientSession(req, phone);
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

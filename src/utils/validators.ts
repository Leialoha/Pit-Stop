import { validate as emailValidate } from 'email-validator';
import { NextFunction, Request, Response } from 'express';
import { phone as phoneValidate } from 'phone';
import { quickDecode } from '@cardog/corgi';

import { sendStatus } from '.';
import { fetchClientSession } from './session';
import { Types } from 'mongoose';

export type Nevered<T> = {
    [K in keyof T]?: never;
}

export type ValidationResult<T> = 
    ({ isValid: true; } & T) |
    ({ isValid: false; } & Nevered<T>);

export type ValidationResultWithErrors<T, E> = 
    ValidationResult<T> & ValidationErrors<E>;

export type ValidationErrors<T> = 
    ({ isValid: true; } & Nevered<T>) |
    ({ isValid: false; } & T);

export type PhoneValidation = ValidationResult<{
    phone: string
}>;

export type EmailValidation = ValidationResult<{
    email: string
}>

export type VinValidation = ValidationResult<{
    make: string
    model: string
    year: string
}>

export type ContentValidation<T, K extends keyof T> = ValidationResult<{
    contents: Pick<T, K>
}> & ValidationErrors<{
    unallowedKeys: string[]
}>;

// TODO: Allow all regions, future implementation
export function validatePhoneNumber(phoneStr: string) : ValidationResult<{ phone: string }> {
    const { isValid, phoneNumber: phone } = phoneValidate(phoneStr, { country: 'USA' });
    if (!isValid) return { isValid: false };
    return { isValid, phone };
}

export function validateObjectID(idStr: string) : ValidationResult<{ id: string, _id: Types.ObjectId }> {
    const isValid = /^[a-f\d]{24}$/gi.test(idStr);
    if (!isValid) return { isValid: false };

    const _id = Types.ObjectId.createFromHexString(idStr);
    return { isValid, id: idStr, _id };
}

export function validateEmail(emailStr: string) : ValidationResult<{ email: string }> {
    const isValid = emailValidate(emailStr);
    if (!isValid) return { isValid: false };
    return { isValid, email: emailStr };
}

export function validateName(nameStr: string) : ValidationResultWithErrors<{ name: string }, { reason: 'empty' | 'too_short' | 'too_long' }> {
    if (nameStr == null || typeof nameStr !== 'string' || nameStr.trim().length == 0)
        return { isValid: false, reason: 'empty' };
    else if (nameStr.trim().length < 3)
        return { isValid: false, reason: 'too_short' };
    else if (nameStr.trim().length > 50)
        return { isValid: false, reason: 'too_long' };
    return { isValid: true, name: nameStr };
}

export async function validateVIN(vin: string) : Promise<VinValidation> {
    const regex = /^[A-HJ-NPR-Z0-9]{17}$/;
    const isValid = regex.test(vin.toUpperCase());
    if (!isValid) return { isValid: false };

    const result = await quickDecode(vin);
    if (!result || !result.valid) return { isValid: false };

    const { make, model: _model, year: _year, trim } = result.components.vehicle;
    const model = [_model, trim].filter(Boolean).join(' ');
    const year = _year.toString();

    return { isValid: true, year, make, model};
}

export function validateAuthorization(req: Request, res: Response, next: NextFunction) {
    if (req.headers['X-Validated'] == 'true') next();
    else sendStatus(res, 401);
}

export function validateContents<T, Keys extends keyof T>(contents: T, allowedKeys: Keys[]) : ContentValidation<T, Keys> {
    const unallowedKeys = Object.keys(contents)
        .filter(key => !allowedKeys.includes(key as Keys));

    const hasExtra = unallowedKeys.length > 0;
    if (hasExtra) return { isValid: false, unallowedKeys };

    return { isValid: true, contents };
}

export function requireContents<T, Keys extends keyof T>(contents: T, requiredKeys: Keys[]) : ValidationErrors<{ missingKeys: Keys[] }> {
    const contentKeys = Object.keys(contents) as Keys[];
    const missingKeys = requiredKeys.filter(key => !contentKeys.includes(key));

    const hasMissing = missingKeys.length > 0;
    if (hasMissing) return { isValid: false, missingKeys };

    return { isValid: true };
}

export function clientHeaders(req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
        if (req.session?.authorization) req.headers.authorization = req.session.authorization;
        else if (req.body?.authorization) req.headers.authorization = req.body.authorization;
    }

    const {
        isValid, phone, sessionId, tokenType
    } = fetchClientSession(req);

    req.headers['X-Validated'] = `${isValid}`;
    req.headers['X-Phone'] = phone;
    req.headers['X-SessionId'] = sessionId;
    req.headers['X-TokenType'] = tokenType;
    next();
}

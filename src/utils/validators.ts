import { validate as emailValidate } from 'email-validator';
import { NextFunction, Request, Response } from 'express';
import { phone as phoneValidate } from 'phone';
import { sendStatus } from '.';
import { fetchClientSession } from './session';
import { quickDecode } from '@cardog/corgi';

export type PhoneValidation = {
    isValid: boolean,
    phone: string
}

export type EmailValidation = {
    isValid: boolean,
    email: string
}

export type VinValidation = {
    isValid: boolean,
    make: string
    model: string
    year: string
}

// TODO: Allow all regions, future implementation
export function validatePhoneNumber(phoneStr: string) : PhoneValidation {
    const { isValid, phoneNumber: phone } = phoneValidate(phoneStr, { country: 'USA' });
    return { isValid, phone };
}

export function validateEmail(emailStr: string) : EmailValidation {
    const isValid = emailValidate(emailStr);
    return { isValid, email: isValid ? emailStr : null };
}

export async function validateVIN(vin: string) : Promise<VinValidation> {
    const regex = /^[A-HJ-NPR-Z0-9]{17}$/;
    const isValid = regex.test(vin.toUpperCase());
    if (!isValid) return { isValid: false, make: null, model: null, year: null };

    const result = await quickDecode(vin);
    if (!result || !result.valid) return { isValid: false, make: null, model: null, year: null };

    const { make, model: _model, year: _year, trim } = result.components.vehicle;
    const model = [_model, trim].filter(Boolean).join(' ');
    const year = _year.toString();

    return { isValid: true, year, make, model};
}

export function validateAuthorization(req: Request, res: Response, next: NextFunction) {
    if (req.headers['X-Validated'] == 'true') next();
    else sendStatus(res, 401);
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

import cookie from "cookie-session";
import { randomBytes, randomInt } from "crypto";
import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import keygrip from "keygrip";
import { AddressInfo } from "net";

import { decodeBase64, encodeBase64 } from ".";
import { COOKIE_SESSION_TIMEOUT as maxAge } from "../constants/system";
import * as jwt from './jwt';

const length = randomInt(5, 10);
const privateKeys = new Array(length).fill(null)
    .map(() => randomBytes(256).toString('hex'));

const keys = keygrip(privateKeys, 'sha256', 'hex');
export const cookieSession = cookie({ keys, maxAge });


export type ClientSessionData = {
    isValid: true,
    error?: never,

    ipAddress: string,
    ipVersion: string | 'IPv4' | 'IPv6',

    phone: string,
    userId: string,
    sessionId: string

    token: string
    tokenType: string,
} | {
    isValid: false,
    error: Error,
    [key: string]: any
}

export function generateClientSession(req: Request, phone: string, userId: string) {
    const { family: ipVersion, address: ipAddress } = req.socket.address() as Partial<AddressInfo>;

    const sessionId = randomBytes(16).toString('hex');
    const encodedAddress = encodeBase64({ ipVersion, ipAddress })

    const session = `${sessionId}.${encodedAddress}`;
    const token = jwt.sign({ phone, userId, session });
    req.session.authorization = `Bearer ${token}`
}

export function fetchClientSession(req: Request) : ClientSessionData {
    try {
        const authorization = req.headers.authorization?.split(' ');
        if (authorization?.length != 2) return { isValid: false, error: new Error('No authorization provided') };
    
        const [ tokenType, token ] = authorization;
        if (tokenType != 'Bearer') return { isValid: false, error: new Error('Invalid token type') };
    
        const { phone, userId, session: sessionData } = jwt.verify(token) as JwtPayload;
        const { length: sdLength, '0': sessionId, '1': encodedAddress } = sessionData.split('.');
        if (sdLength != 2) return { isValid: false, error: new Error('Invalid session data') };
    
        const decodedAddress = decodeBase64(encodedAddress);
        const { ipVersion, ipAddress } = JSON.parse(decodedAddress);
    
        return { phone, userId, sessionId, ipVersion, ipAddress, tokenType, token, isValid: true };
    } catch (error) {
        return { isValid: false, error }
    }
}

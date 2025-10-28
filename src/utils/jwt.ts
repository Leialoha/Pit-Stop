import { generateKeyPairSync } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import * as jwt from 'jsonwebtoken';

export let privateKey: string;
export let publicKey: string;

type Payload = string | object | Buffer<ArrayBufferLike>;
export type KeyPair = { publicKey: string; privateKey: string; }

export function initalize() : KeyPair {
    const keyExists = existsSync('keys/public.key')
        && existsSync('keys/private.key');

    if (keyExists) return loadKeys();
    if (!existsSync('keys/')) mkdirSync('keys/');

    const keyPair = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;

    writeFileSync('keys/public.key', publicKey);
    writeFileSync('keys/private.key', privateKey);
    return keyPair;
}

function loadKeys() : KeyPair {
    publicKey = readFileSync('keys/public.key', { encoding: 'utf8' });
    privateKey = readFileSync('keys/private.key', { encoding: 'utf8' });
    return { publicKey, privateKey };
}

export function sign(payload: Payload) {
    return jwt.sign(payload, privateKey, { algorithm: "RS256", expiresIn: '4h' });
}

export function verify(token: string) {
    return jwt.verify(token, publicKey, { algorithms: [ "RS256" ] });
}

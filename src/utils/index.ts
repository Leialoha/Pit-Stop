import { randomInt } from "crypto";
import { Response } from "express";
import status from "statuses";

export function sendStatus(res: Response, code: number) {
    const message: string = status.message[code] || `${code}`;
    res.status(code).json({ code, message });
}

export function sendClientError(res: Response, message: string, code: number = 400) {
    res.status(code).json({ code, message });
    return null;
}

export function systemTime(future: number = 0) {
    return Math.floor(Date.now() / 1000) + future;
}

export function encodeBase64(data: string | object) {
    const input = (typeof data == 'object') ? JSON.stringify(data) : data;
    return Buffer.from(input).toString('base64');
}

export function decodeBase64(data: string) {
    return Buffer.from(data, 'base64').toString('utf8');
}

export function randomName() {
    const prefixes = [
        'Alloy', 'Apex', 'Carbon', 'Chrome', 'Diesel', 'Drift',
        'Dune', 'Ember', 'Frost', 'Gear', 'Glacier', 'Ignition',
        'Iron', 'Mach', 'Mist', 'Nitro', 'Ocean', 'Quantum',
        'Rapid', 'Solar', 'Sonic', 'Steel', 'Storm', 'Terra',
        'Thunder', 'Titanium', 'Turbo', 'Velo', 'Velocity'
    ];

    const suffixes = [
        'Blazer', 'Bolt', 'Breaker', 'Charge', 'Core', 'Current',
        'Cyclone', 'Dash', 'Dynamo', 'Forge', 'Howler', 'Line',
        'Phantom', 'Pulse', 'Racer', 'Reactor', 'Rider', 'Roamer',
        'Runner', 'Storm', 'Strike', 'Surge', 'Tempest', 'Titan',
        'Trailer', 'Treader', 'Vector', 'Veil', 'Vortex'
    ];

    return [prefixes, suffixes]
        .map(values => values[randomInt(values.length)])
        .join(' ');
}

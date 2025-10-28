import { Response } from "express";
import status from "statuses";

export function sendStatus(res: Response, code: number) {
    const message: string = status.message[code] || `${code}`;
    res.status(code).json({ code, message });
}

export function sendClientError(res: Response, message: string, code: number = 400) {
    res.status(code).json({ code, message });
}

export function systemTime(future: number = 0) {
    return Math.floor(Date.now() / 1000) + future;
}

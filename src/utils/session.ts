import keygrip from "keygrip";
import cookie from "cookie-session";
import { randomBytes, randomInt } from "crypto";
import { COOKIE_SESSION_TIMEOUT as maxAge } from "../constants/system";

const length = randomInt(5, 10);
const privateKeys = new Array(length).fill(null)
    .map(() => randomBytes(256).toString('hex'));

const keys = keygrip(privateKeys, 'sha256', 'hex');
export const cookieSession = cookie({ keys, maxAge });

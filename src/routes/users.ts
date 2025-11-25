import { Router } from "express";
import rateLimit from "express-rate-limit";

import * as controller from "../controllers/userController";

const router = Router();

// This is a global limiter
// In-case if we are being "botted"
const requestGlobalLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10, // 10 req / 5 min
});

// This is a per-phone limiter
// In-case the wrong number was used
const requestPhoneLimiter = rateLimit({
    windowMs: 15 * 1000,
    max: 1, // 1 req / 15 sec / phone number
    keyGenerator: (req) => {
        // This doesn't check for numbers that are relatively equal,
        // such as 1234567890 or +1 1234567890. But the internal checks
        // should suffice.

        let number: string = req.params.number || null;
        if (number == null) return 'unknown';
        return number.replace(/[^+\d]+/gi, '');
    },
});

router.route('/')
    .get(controller.getUser);

router.route('/self')
    .get(controller.getSelf);

router.route('/:number/login')
    .all(requestGlobalLimiter)
    .get(requestPhoneLimiter, controller.requestLogin)
    .post(controller.validateLogin)

export default router;

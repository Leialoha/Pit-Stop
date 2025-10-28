import express, { Router, Request, Response, NextFunction } from 'express';
import { ResponseStatusException } from './types';
import { cookieSession } from './utils/session';

import userRouter from './routes/users';

const app = express();
app.use(express.json());
app.use(cookieSession);

app.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
    if (err instanceof ResponseStatusException) res.status(err.status).json(err.json);
    else if (err) res.status(500).json({ status: "500", message: err.message });
    else next();
});

app.use(function (req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
        if (req.session?.authorization) req.headers.authorization = req.session.authorization;
        else if (req.body?.authorization) req.headers.authorization = req.body.authorization;
    }

    next();
});


const apiRouter = Router();
apiRouter.use('/user', userRouter);


app.use('/api', apiRouter);

export default app;

import express, { Router, Request, Response, NextFunction } from 'express';

import userRouter from './routes/users';
import groupRouter from './routes/groups';
import vehicleRouter from './routes/vehicles';
import { ResponseStatusException } from './types';
import { cookieSession } from './utils/session';
import { clientHeaders } from './utils/validators';

const app = express();
app.use(express.json());
app.use(cookieSession);
app.use(clientHeaders);

app.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
    if (err instanceof ResponseStatusException) res.status(err.status).json(err.json);
    else if (err) res.status(500).json({ status: "500", message: err.message });
    else next();
});

const apiRouter = Router();
apiRouter.use('/users', userRouter);
apiRouter.use('/groups', groupRouter);
apiRouter.use('/vehicles', vehicleRouter);

app.use('/api', apiRouter);

export default app;

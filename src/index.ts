import { NextFunction, Request, Response } from 'express';
import express from 'express';

import { HOST, PORT } from './constants';

import { ResponseStatusException } from './types';
import { resolve } from 'path';
import { connectDB } from './database';

connectDB()
const app = express();

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.sendFile(resolve('pages/welcome.html'));
});

app.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
    if (err instanceof ResponseStatusException) res.status(err.status).json(err.json);
    else if (err) res.status(500).json({ status: "500", message: err.message });
    else next();
});

app.listen(PORT, HOST, () => {
    console.log(`Server started on port ${PORT}`);
});


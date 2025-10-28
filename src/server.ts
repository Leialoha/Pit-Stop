import { HOST, PORT } from './constants';
import { initalize as initalizeJWT } from './utils/jwt';
import { connectDB } from './database';
import app from './app';

connectDB();
initalizeJWT();

app.listen(PORT, HOST, () => {
    console.log(`Server started on port ${PORT}`);
});

import app from './app';
import { HOST, PORT } from './constants';
import { connectDB } from './database';
import { initalize as initalizeJWT } from './utils/jwt';

connectDB();
initalizeJWT();

app.listen(PORT, HOST, () => {
    console.log(`Server started on port ${PORT}`);
});

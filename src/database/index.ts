import mongoose from 'mongoose';

import { DATABASE_URL, DATABASE_NAME } from '../constants';

export * from './interfaces';
export * from './schemas';

export async function connectDB() {
    try {
        console.log(`MongoDB connecting to: ${DATABASE_URL}`);
        await mongoose.connect(DATABASE_URL, { dbName: DATABASE_NAME });
        console.log('MongoDB connected')
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

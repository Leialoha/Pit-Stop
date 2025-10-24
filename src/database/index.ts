import mongoose from 'mongoose';
import { DATABASE_URL, DATABASE_NAME } from '../constants';

export * from './Interfaces';
export * from './Schemas';

export async function connectDB() {
    console.log(`MongoDB connecting to: ${DATABASE_URL}`);
    await mongoose.connect(DATABASE_URL, { dbName: DATABASE_NAME });
    console.log('MongoDB connected')
}

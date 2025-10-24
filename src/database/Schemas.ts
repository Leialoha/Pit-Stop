import { model, Schema, SchemaOptions } from 'mongoose';
import { IVehicle, IReminder, IExpenseRecord, IServiceRecord } from './Interfaces';

const VehicleSchema = new Schema<IVehicle>({
    vehicleID: { type: Schema.Types.ObjectId, unique: true, required: true },
    name: { type: String, required: false },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: String, required: true },
    vin: { type: String, required: false },
    licensePlate: { type: String, required: false },
}, hideOptions());


const ReminderSchema = new Schema<IReminder>({
    taskID: { type: Schema.Types.ObjectId, required: true, unique: true },
    vehicleID: { type: Schema.Types.ObjectId, required: true, ref: 'vehicles' },
    taskName: { type: String, required: true },
    dueDate: { type: String, required: false },
    dueMileage: { type: Number, required: false },
    status: { type: String, required: true },
}, hideOptions());

const ExpenseRecordSchema = new Schema<IExpenseRecord>({
    recordID: { type: Schema.Types.ObjectId, required: true, unique: true },
    vehicleID: { type: Schema.Types.ObjectId, required: true, ref: 'vehicles' },
    dateOfRecord: { type: String, required: true },
    vendor: { type: String, required: true },
    wasService: { type: Boolean, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    totalCost: { type: Number, required: true },
    paymentMethod: { type: String, required: false },
    warrantyInfo: { type: String, required: false }
}, hideOptions());

const ServiceRecordSchema = new Schema<IServiceRecord>({
    serviceID: { type: Schema.Types.ObjectId, required: true, unique: true },
    vehicleID: { type: Schema.Types.ObjectId, required: true, ref: 'vehicles' },
    recordID: { type: Schema.Types.ObjectId, required: false, ref: 'expenses' },
    odometerAtService: { type: String, required: false },
    serviceType: { type: String, required: true },
    nextDueDate: { type: String, required: false },
    nextDueMileage: { type: Number, required: false },
    laborCost: { type: Number, required: false },
    partsCost: { type: Number, required: false }
}, hideOptions());


export const VehicleModel = model<IVehicle>('vehicle', VehicleSchema);
export const ReminderModel = model<IReminder>('reminders', ReminderSchema);
export const ExpenseRecordModel = model<IExpenseRecord>('expenses', ExpenseRecordSchema);
export const ServiceRecordModel = model<IServiceRecord>('services', ServiceRecordSchema);


function hideOptions<T>(): SchemaOptions<T> {
    return {
        toJSON: {    
            transform(_, ret) {
                delete ret._id;
                delete ret.__v;
            }
        },
        toObject: {
            transform(_, ret) {
                delete ret._id;
                delete ret.__v;
            }
        },
        strict: true
    }
}
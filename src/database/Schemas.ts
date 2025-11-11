import { model, Schema, SchemaOptions } from 'mongoose';
import { IUser, IGroup, IVehicle, IReminder, IExpenseRecord, IServiceRecord, IAttachment, MongoEntry, GroupUsers } from './interfaces';
import { validateEmail, validatePhoneNumber } from '../utils/validators';
import * as LANG from '../constants/lang';

const required = true;
const unique = true;
const sparse = true;

const AttachmentSchema = new Schema<IAttachment>({
    uploader: { type: Schema.Types.ObjectId, ref: 'groups', required },
    fileUrl: { type: String, required },
    fileName: { type: String, required },
    uploadedAt: { type: Date, default: new Date(), required },
}, hideOptions());

const UserSchema = new Schema<IUser>({
    phone: { type: String, required, unique },
    name: { type: String, required },
    email: { type: String, required },
}, hideOptions());

UserSchema.pre('save', async function (next) {
    if (this.isModified('phone')) {
        let { isValid, phone } = validatePhoneNumber(this.phone);
        if (!isValid) return next(new Error(LANG.INVALID_PHONE_NUMBER));
        else this.phone = phone;
    }

    if (this.isModified('email')) {
        let { isValid, email } = validateEmail(this.email);
        if (!isValid) return next(new Error(LANG.INVALID_PHONE_NUMBER));
        else this.email = email;
    }
    
    next();
});

const GroupPermissionSchema = new Schema<GroupUsers>({
    userId: { type: Schema.Types.ObjectId, refPath: 'users' },
    phone: { type: String },
    permissions: { type: Number }
}, { _id: false });

GroupPermissionSchema.pre('save', async function (next) {
    if (!(this.userId || this.phone))
        return next(new Error(LANG.INVALID_USER_REFERENCE));

    if (this.isModified('phone') && this.phone) {
        let { isValid, phone } = validatePhoneNumber(this.phone);
        if (!isValid) return next(new Error(LANG.INVALID_PHONE_NUMBER));
        else this.phone = phone;
    }
    
    next();
});

const GroupSchema = new Schema<IGroup>({
    users: [{ type: GroupPermissionSchema }],
    name: { type: String, required },
    description: { type: String },
}, hideOptions());

const VehicleSchema = new Schema<IVehicle>({
    groupID: { type: Schema.Types.ObjectId, ref: 'groups', required }, 
    name: { type: String },
    make: { type: String, required },
    model: { type: String, required },
    year: { type: String, required },
    vin: { type: String, unique, sparse },
    licensePlate: { type: String, unique, sparse },
}, hideOptions());


const ReminderSchema = new Schema<IReminder>({
    vehicleID: { type: Schema.Types.ObjectId, required, ref: 'vehicles' },
    taskName: { type: String, required },
    status: { type: String, required },
    dueDate: { type: String },
    dueMileage: { type: Number },
}, hideOptions());

const ExpenseRecordSchema = new Schema<IExpenseRecord>({
    vehicleID: { type: Schema.Types.ObjectId, required, ref: 'vehicles' },
    odometer: { type: Number },
    dateOfRecord: { type: Date, default: new Date(), required },
    vendor: { type: String, required },
    wasService: { type: Boolean, required },
    category: { type: String, required },
    description: { type: String, required },
    totalCost: { type: Number, required },
    paymentMethod: { type: String },
    warrantyInfo: { type: String }
}, hideOptions());

const ServiceRecordSchema = new Schema<IServiceRecord>({
    vehicleID: { type: Schema.Types.ObjectId, required, ref: 'vehicles' },
    recordID: { type: Schema.Types.ObjectId, ref: 'expenses' },
    odometer: { type: Number, required },
    serviceType: { type: String, required },
    nextDueDate: { type: Date },
    nextDueMileage: { type: Number },
    laborCost: { type: Number },
    partsCost: { type: Number }
}, hideOptions());

export const AttachmentModel = model<IAttachment>('attachments', AttachmentSchema);
export const UserModel = model<IUser>('users', UserSchema);
export const GroupModel = model<IGroup>('groups', GroupSchema);
export const VehicleModel = model<IVehicle>('vehicle', VehicleSchema);
export const ReminderModel = model<IReminder>('reminders', ReminderSchema);
export const ExpenseRecordModel = model<IExpenseRecord>('expenses', ExpenseRecordSchema);
export const ServiceRecordModel = model<IServiceRecord>('services', ServiceRecordSchema);


function hideOptions<T>(): SchemaOptions<T & MongoEntry> {
    return {
        toJSON: {    
            transform(_, ret) {
                delete ret.__v;
            }
        },
        toObject: {
            transform(_, ret) {
                delete ret.__v;
            }
        },
        strict: true
    }
}

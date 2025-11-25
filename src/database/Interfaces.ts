import { Types } from "mongoose"

import { RequireOne } from "../types";

export type MongoEntry = {
    /** Unique ID of the entry */
    _id: Types.ObjectId,
};

/** Attachment Information */
export type IAttachment = {
    /** Unique ID of the uploader */
    uploader: Types.ObjectId,
    /** File url of the attachment */
    fileUrl: string,
    /** File name of the attachment */
    fileName: string,
    /** Date of the attachment upload */
    uploadedAt: Date | string,
} & MongoEntry;

/** User Information */
export type IUser = {
    /** User name (e.g., "John Doe") */
    name: string,
    /** Phone number */
    phone: string,
    /** Recovery Email */
    email: string
} & MongoEntry;

/** Group Information */
export type IGroup = {
    /** Display name (e.g., "Personal Cars") */
    name: string,
    /** Details about group */
    description?: string,
    /** Unique IDs of the users */
    users: GroupUsers[],
    /** Unique entries of group vehicles */
    vehicles?: IVehicle[],
} & MongoEntry;

/** Vehicle Information */
export type IVehicle = {
    /** Unique ID of the group */
    groupID: Types.ObjectId,
    /** Display name */
    name?: string,
    /** Manufacturer */
    make: string,
    /** Vehicle model */
    model: string,
    /** Model year */
    year: string,
    /** Vehicle Identification Number */
    vin?: string,
    /** Optional for quick reference */
    licensePlate?: string
} & MongoEntry;

/** Maintenance / Service Records */
export type IServiceRecord = {
    /** Unique ID of the vehicle */
    vehicleID: Types.ObjectId,
    /** Unique ID of the expense */
    expenseID?: Types.ObjectId,
    /** Mileage at the time of service */
    odometer: number,
    /** Oil Change, Tire Rotation, Brake Service, etc. */
    serviceType: string,
    /** For scheduling reminders (based on Date) */
    nextDueDate?: Date | string,
    /** For scheduling reminders (based on Mileage) */
    nextDueMileage?: number,
    /** Cost of the work */
    laborCost?: number,
    /** Cost of materials used */
    partsCost?: number,
} & MongoEntry;

/** Receipts / Expenses */
export type IExpenseRecord = {
    /** Unique ID of the vehicle */
    vehicleID: Types.ObjectId,
    /** Unique ID of the attachment */
    attachmentID?:  Types.ObjectId,
    /** Mileage at the time of expense */
    odometer?: number,
    /** Purchase date */
    dateOfRecord: Date | string,
    /** Store or service center */
    vendor: string,
    /** Tracked by service */
    wasService: boolean,
    /** Maintenance, Fuel, Accessories, Insurance, Registration, etc */
    category: string,
    /** Details about expense */
    description: string,
    /** Total expense */
    totalCost: number,
    /** Total amount of items */
    quantity: number,
    /** Credit, cash, etc */
    paymentMethod?: string,
    /** Optional for tracking coverage */
    warrantyInfo?: string,
} & MongoEntry;

/** Reminders & Scheduling */
export type IReminder = {
    /** e.g., "Oil Change Reminder" */
    taskName: string,
    /** Unique ID of the vehicle */
    vehicleID: Types.ObjectId,
    /** Trigger for next service (date) */
    dueDate?: Date | string,
    /** Trigger for next service (date) */
    dueMileage?: number,
    /** Pending / Completed / Overdue */
    status: string
} & MongoEntry;

// Interface Values
export type UserReference = RequireOne<{
    userID: Types.ObjectId
    phone: string,
}>;

export type GroupUsers = UserReference & {
    permissions: number
};

// Query Lookups
export type Identifiers = {
    ids: Types.ObjectId[];
}

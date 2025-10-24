import { Types } from "mongoose"

/** Vehicle Information */
export type IVehicle = {
    /** Unique ID of the vehicle */
    vehicleID: Types.ObjectId,
    /** Display name (e.g., "Tara's Civic") */
    name?: string,
    /** Manufacturer (e.g., Honda) */
    make: string,
    /** Vehicle model (e.g., Civic LX) */
    model: string,
    /** Model year */
    year: string,
    /** Vehicle Identification Number */
    vin?: string,
    /** Optional for quick reference */
    licensePlate?: string
}

/** Maintenance / Service Records */
export type IServiceRecord = {
    /** Unique ID of the service */
    serviceID: Types.ObjectId,
    /** Unique ID of the vehicle */
    vehicleID: Types.ObjectId,
    /** Unique ID of the expense */
    recordID?: Types.ObjectId,
    /** Mileage at the time of service */
    odometerAtService?: string,
    /** (Oil Change, Tire Rotation, Brake Service, etc.) */
    serviceType: string,
    /** For scheduling reminders (based on Date) */
    nextDueDate?: string,
    /** For scheduling reminders (based on Mileage) */
    nextDueMileage?: number,
    /** Cost of the work */
    laborCost?: number,
    /** Cost of materials used */
    partsCost?: number,
}

/** Receipts / Expenses */
export type IExpenseRecord = {
    /** Unique ID of the expense */
    recordID: Types.ObjectId,
    /** Unique ID of the vehicle */
    vehicleID: Types.ObjectId,
    /** Purchase date */
    dateOfRecord: string,
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
    /** Credit, cash, etc */
    paymentMethod?: string,
    /** Optional for tracking coverage */
    warrantyInfo?: string
}

/** Reminders & Scheduling */
export type IReminder = {
    /** Unique ID of the vehicle */
    taskID: Types.ObjectId,
    /** e.g., "Oil Change Reminder" */
    taskName: string,
    /** Unique ID of the vehicle */
    vehicleID: Types.ObjectId,
    /** Trigger for next service (date) */
    dueDate?: string,
    /** Trigger for next service (date) */
    dueMileage?: number,
    /** Pending / Completed / Overdue */
    status: string
}
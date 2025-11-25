
/** Invalid Phone Number */
export const INVALID_PHONE_NUMBER = 'Invalid Phone Number: USA Region Only';

/** Invalid Email Address */
export const INVALID_EMAIL_ADDRESS = 'Invalid Email Address';

/** Invalid User Reference */
export const INVALID_USER_REFERENCE = 'Invalid User Reference: Missing ID or Phone Number';

/** User Not Found */
export const USER_NOT_FOUND = 'User Not Found';

/** Invalid One-Time Password */
export const INVALID_OTP_CODE = 'Invalid One-Time Password';

/** Too Many Requests */
export const TOO_MANY_REQUESTS = 'Too many requests, please try again later.';

/** Invalid Parameters: Extra Keys */
export function INVALID_PARAMETERS_EXTRA_KEYS(extraKeys: string[]) : string {
    return `Invalid Parameters: Extra Keys - ${extraKeys.join(', ')}`;
}

/** Invalid Parameters: Missing Keys */
export function INVALID_PARAMETERS_MISSING_KEYS(missingKeys: string[]) : string {
    return `Invalid Parameters: Missing Keys - ${missingKeys.join(', ')}`;
}

/** Invalid Field */
export function INVALID_FIELD(reason: string) : string {
    return `Invalid Field: ${reason}`;
}

/** Unauthorized Access */
export const UNAUTHORIZED_ACCESS = 'Unauthorized Access';

/** Vehicle Not Found */
export const VEHICLE_NOT_FOUND = 'Vehicle Not Found';

/** Group Not Found */
export const GROUP_NOT_FOUND = 'Group Not Found';

/** Expense Record Not Found */
export const EXPENSE_NOT_FOUND = 'Expense Record Not Found';

/** Attachment Not Found */
export const ATTACHMENT_NOT_FOUND = 'Attachment Not Found';

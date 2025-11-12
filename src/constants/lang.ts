
/** Invalid Phone Number */
export const INVALID_PHONE_NUMBER = 'Invalid Phone Number: USA Region Only';

/** Invalid Email Address */
export const INVALID_EMAIL_ADDRESS = 'Invalid Email Address';

/** Invalid User Reference */
export const INVALID_USER_REFERENCE = 'Invalid User Reference: Missing ID or Phone Number';

/** Invalid One-Time Password */
export const INVALID_OTP_CODE = 'Invalid One-Time Password';

/** Too Many Requests */
export const TOO_MANY_REQUESTS = 'Too many requests, please try again later.';

/** Invalid Parameters: Extra Keys */
export function INVALID_PARAMETERS_EXTRA_KEYS(extraKeys: string[]) : string {
    return `Invalid Parameters: Extra Keys - ${extraKeys.join(', ')}`;
}

/** Invalid Field */
export function INVALID_FIELD(reason: string) : string {
    return `Invalid Field: ${reason}`;
}

/** Unauthorized Access */
export const UNAUTHORIZED_ACCESS = 'Unauthorized Access';


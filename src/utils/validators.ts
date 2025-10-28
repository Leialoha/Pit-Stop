import { validate as emailValidate } from 'email-validator';
import { phone as phoneValidate } from 'phone';

export type PhoneValidation = {
    isValid: boolean,
    phone: string
}

export type EmailValidation = {
    isValid: boolean,
    email: string
}

// TODO: Allow all regions, future implementation
export function validatePhoneNumber(phoneStr: string) : PhoneValidation {
    const { isValid, phoneNumber: phone } = phoneValidate(phoneStr, { country: 'USA' });
    return { isValid, phone };
}

export function validateEmail(emailStr: string) : EmailValidation {
    const isValid = emailValidate(emailStr);
    return { isValid, email: isValid ? emailStr : null };
}

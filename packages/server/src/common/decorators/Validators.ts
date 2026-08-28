import { Transform } from 'class-transformer';
import {
  isEmail,
  registerDecorator,
  ValidateIf,
  ValidationOptions,
} from 'class-validator';
import {
  MAX_EMAIL_LIST_ADDRESSES,
  MAX_EMAIL_LIST_LENGTH,
  normalizeEmailList,
  parseEmailList,
} from '@bigcapital/utils';

/**
 * Decorator that converts the property value to a number.
 * @returns PropertyDecorator
 */
export function ToNumber() {
  return Transform(({ value }) => {
    const defaultValue = null;

    if (typeof value === 'number') {
      return value;
    }
    // If value is an empty string or undefined/null, return it as-is (won’t pass validation)
    if (value === '' || value === null || value === undefined) {
      return defaultValue;
    }
    const parsed = Number(value);
    return !isNaN(parsed) ? parsed : value;
  });
}

/**
 * Validates if the property is not empty.
 * @returns PropertyDecorator
 */
export function IsOptional(validationOptions?: ValidationOptions) {
  return ValidateIf((_obj, value) => {
    return value !== null && value !== undefined && value !== '';
  }, validationOptions);
}

/**
 * Normalizes a user-entered email list before validation and persistence.
 */
export function NormalizeEmailList() {
  return Transform(({ value }) => {
    return typeof value === 'string' ? normalizeEmailList(value) : value;
  });
}

/**
 * Validates a comma-separated list of email addresses.
 */
export function IsEmailList(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEmailList',
      target: object.constructor,
      propertyName,
      options: {
        message:
          'Email must contain valid email addresses separated by commas.',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (
            typeof value !== 'string' ||
            value.length > MAX_EMAIL_LIST_LENGTH
          ) {
            return false;
          }
          const addresses = parseEmailList(value);

          return (
            addresses.length > 0 &&
            addresses.length <= MAX_EMAIL_LIST_ADDRESSES &&
            addresses.every((address) => isEmail(address))
          );
        },
      },
    });
  };
}

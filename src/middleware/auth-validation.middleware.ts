import { logger } from 'src/helper/logger';
import {
  validateDob,
  validateEmail,
  validateEmptyFields,
} from 'src/utils/validator';

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  dateOfBirth: Date | string;
  address?: string;
  phoneNumber?: string;
};

type LoginInput = {
  email: string;
  password: string;
}

type LoginValidationResult =
  | {
    ok: true;
    data: {
      email: string;
      password: string;
    };
  }
  | {
    ok: false;
    message: string;
  };

type RegisterValidationResult =
  | {
    ok: true;
    data: {
      name: string;
      email: string;
      password: string;
      dateOfBirth: Date;
      address?: string;
      phoneNumber?: string;
    };
  }
  | {
    ok: false;
    message: string;
  };

export function validateRegisterInput(
  payload: RegisterInput,
): RegisterValidationResult {
  logger.info('Validating register input', { payload });
  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();
  const emptyFields = validateEmptyFields({
    name,
    email,
    password,
    dateOfBirth: payload.dateOfBirth,
  });

  if (emptyFields.length > 0) {
    return {
      ok: false,
      message: `Empty fields: ${emptyFields.join(', ')}`,
    };
  }

  if (!validateEmail(email)) {
    return {
      ok: false,
      message: 'Email format is invalid',
    };
  }

  const dobValidation = validateDob(payload.dateOfBirth);

  if (!dobValidation.ok) {
    return {
      ok: false,
      message: 'dateOfBirth is invalid. Use ISO date format (YYYY-MM-DD)',
    };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      password,
      dateOfBirth: dobValidation.value,
      address: payload.address?.trim() || undefined,
      phoneNumber: payload.phoneNumber?.trim() || undefined,
    },
  };
}

export function validateLoginInput(
  payload: LoginInput,
): LoginValidationResult {
  logger.info('Validating login input', { payload });
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();
  const emptyFields = validateEmptyFields({ email, password });

  if (emptyFields.length > 0) {
    return {
      ok: false,
      message: `Empty fields: ${emptyFields.join(', ')}`,
    };
  }

  if (!validateEmail(email)) {
    return {
      ok: false,
      message: 'Email format is invalid',
    };
  }

  return {
    ok: true,
    data: {
      email,
      password,
    },
  };
}

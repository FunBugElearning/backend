import moment from 'moment';

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  dateOfBirth: Date | string;
  address?: string;
  phoneNumber?: string;
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

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateDob(
  dateOfBirth: unknown,
): { ok: true; value: Date } | { ok: false } {
  if (!dateOfBirth) {
    return { ok: false };
  }

  const parsedDob = moment(dateOfBirth, moment.ISO_8601, true);

  if (!parsedDob.isValid() || parsedDob.isAfter(moment())) {
    return { ok: false };
  }

  return { ok: true, value: parsedDob.toDate() };
}

export function validateRegisterInput(
  payload: RegisterInput,
): RegisterValidationResult {
  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();

  if (!name || !email || !password) {
    return {
      ok: false,
      message: 'name, email and password are required',
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

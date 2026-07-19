import moment from 'moment';

export function validateEmptyFields(
  payload: Record<string, unknown>,
): string[] {
  const emptyFields: string[] = [];

  for (const [key, value] of Object.entries(payload)) {
    const isPlainObject =
      typeof value === 'object' &&
      value !== null &&
      (value as Record<string, unknown>).constructor === Object;

    const isEmpty =
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '') ||
      (isPlainObject && Object.keys(value).length === 0);

    if (isEmpty) {
      emptyFields.push(key);
    }
  }

  return emptyFields;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

export function validateEmptyFields(payload: Record<string, any>): string[] {
    const emptyFields: string[] = [];

    for(const [key, value] of Object.entries(payload)) {
        const isEmpty = value === null || value === undefined ||
            (typeof value === 'string' && value.trim() === '') ||
            (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0);

        if(isEmpty) {
            emptyFields.push(key)
        }
    }

    return emptyFields;
}
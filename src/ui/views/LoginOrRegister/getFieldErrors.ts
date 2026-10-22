export type FieldErrors = Partial<Record<string, string>>;

// The account server returns errors keyed by field name, except when two password fields don't match. That error is shown under the second field, but both fields are highlighted, which is what the empty string is for.
export const getFieldErrors = (errors: Record<string, string>) => {
	const fieldErrors: FieldErrors = { ...errors };

	const mismatches = [
		["passwords", "password", "password2"],
		["newPasswords", "newPassword", "newPassword2"],
	] as const;
	for (const [key, field1, field2] of mismatches) {
		if (fieldErrors[key] !== undefined) {
			fieldErrors[field1] ??= "";
			fieldErrors[field2] = fieldErrors[key];
			delete fieldErrors[key];
		}
	}

	return fieldErrors;
};

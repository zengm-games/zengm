// The account server only sets errors.username when an email and password match more than one account, so it can tell the player to use their username instead.
export const getLoginErrorMessage = (data: {
	errors?: Record<string, string>;
}) => {
	return data.errors?.username ?? "Invalid username, email, or password.";
};

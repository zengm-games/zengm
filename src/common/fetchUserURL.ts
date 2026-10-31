const HTTP_ERROR_DESCRIPTIONS: Record<number, string> = {
	400: "bad request",
	401: "unauthorized",
	403: "forbidden",
	404: "file not found",
	500: "internal server error",
	502: "bad gateway",
	503: "service unavailable",
};

// For loading a file from a URL the user entered, with error messages that help them figure out what's wrong with the URL or the server
export const fetchUserURL = async (url: string) => {
	let response;
	try {
		response = await fetch(url);
	} catch {
		throw new Error(
			"Could be a network error, an invalid URL, or an invalid Access-Control-Allow-Origin header",
		);
	}

	if (!response.ok) {
		const description = HTTP_ERROR_DESCRIPTIONS[response.status];
		throw new Error(
			`Server responded with HTTP error code ${response.status}${
				description ? ` (${description})` : ""
			}`,
		);
	}

	return response;
};

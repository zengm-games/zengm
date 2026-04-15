export const fetchWrapper = async ({
	url,
	method,
	headers,
	data,
	credentials,
}: {
	url: string;
	method: "GET" | "POST";
	headers?: {
		[key: string]: string;
	};
	data: FormData | URLSearchParams | Record<string, string>;
	credentials?: "include";
}): Promise<any> => {
	let body;

	if (data instanceof FormData || data instanceof URLSearchParams) {
		body = data;
	} else if (data !== undefined) {
		body = new URLSearchParams(data);
	}

	// For GET request, append data to query string, since fetch doesn't like GET and body
	if (method === "GET" && body !== undefined) {
		url += `?${body.toString()}`;
		body = undefined;
	}

	const response = await fetch(url, {
		method,
		headers: headers ? new Headers(headers) : undefined,
		body,
		credentials,
	});
	if (!response.ok) {
		throw new Error(`HTTP error ${response.status}`);
	}

	// HACK HACK HACK! Some of my APIs (logout) return no content, rather than JSON
	if (url.endsWith("logout.php")) {
		return undefined;
	}

	return response.json();
};

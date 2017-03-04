// @flow

import queryString from 'query-string';

const fetchWrapper = async ({
    url,
    method,
    headers,
    data,
    credentials,
}: {
    url: string,
    method: 'GET' | 'POST',
    headers?: {[key: string]: string},
    data?: any,
    credentials?: 'include',
}) => {
    let body = queryString.stringify(data);

    // For GET request, append data to query string, since fetch doesn't like GET and body
    if (method === 'GET' && data !== undefined) {
        url += `?${body}`;
        body = undefined;
    }

    if (headers !== undefined) {
        headers = new Headers(headers);
    }

    const response = await fetch(url, {
        method,
        headers,
        body,
        credentials,
    });
    return response.json();
};

export default fetchWrapper;

// @flow

import queryString from 'query-string';

const fetchWrapper = async ({
    url,
    method,
    data,
    credentials,
}: {
    url: string,
    method: 'GET' | 'POST',
    data: any | void,
    credentials: 'include' | void,
}) => {
    let body = queryString.stringify(data);

    // For GET request, append data to query string, since fetch doesn't like GET and body
    if (method === 'GET' && data !== undefined) {
        url += `?${body}`;
        body = undefined;
    }

    const response = await fetch(url, {
        method,
        body,
        credentials,
    });
    return response.json();
};

export default fetchWrapper;

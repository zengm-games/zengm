async function updateToken(inputs) {
    return {
        token: inputs.token,
    };
}

export default {
    inLeague: false,
    runBefore: [updateToken],
};

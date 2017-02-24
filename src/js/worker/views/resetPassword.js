import bbgmViewReact from '../../util/bbgmViewReact';
import ResetPassword from '../../ui/views/ResetPassword';

function get(ctx) {
    return {
        token: ctx.params.token,
    };
}

async function updateToken(inputs) {
    return {
        token: inputs.token,
    };
}

export default bbgmViewReact.init({
    id: "resetPassword",
    get,
    inLeague: false,
    runBefore: [updateToken],
    Component: ResetPassword,
});

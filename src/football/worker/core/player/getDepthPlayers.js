// @flow

// Translate team.depth from pids to player objects, while validating that it contains all players on the team (supplied by `players`) and no extraneous players.
const getDepthPlayers = <
    T: {
        pid: number,
    },
>(
    depth: {
        QB: number[],
        RB: number[],
        WR: number[],
        TE: number[],
        OL: number[],
        DL: number[],
        LB: number[],
        CB: number[],
        S: number[],
        K: number[],
        P: number[],
        KR: number[],
        PR: number[],
    },
    players: T[],
): {
    QB: T[],
    RB: T[],
    WR: T[],
    TE: T[],
    OL: T[],
    DL: T[],
    LB: T[],
    CB: T[],
    S: T[],
    K: T[],
    P: T[],
    KR: T[],
    PR: T[],
} => {
    // $FlowFixMe
    return Object.keys(depth).reduce((obj, pos) => {
        obj[pos] = depth[pos]
            .map(pid => players.find(p => p.pid === pid))
            .concat(
                // $FlowFixMe
                players.map(p => (depth[pos].includes(p.pid) ? undefined : p)),
            )
            .filter(p => p !== undefined);
        return obj;
    }, {});
};

export default getDepthPlayers;

// @flow

const normal = [
    {
        off: {
            QB: 1,
            RB: 1,
            WR: 3,
            TE: 1,
            OL: 5,
        },
        def: {
            DL: 4,
            LB: 2,
            CB: 3,
            S: 2,
        },
    },
    {
        off: {
            QB: 1,
            RB: 2,
            WR: 2,
            TE: 1,
            OL: 5,
        },
        def: {
            DL: 3,
            LB: 4,
            CB: 2,
            S: 2,
        },
    },
    {
        off: {
            QB: 1,
            RB: 2,
            WR: 1,
            TE: 2,
            OL: 5,
        },
        def: {
            DL: 4,
            LB: 3,
            CB: 2,
            S: 2,
        },
    },
    {
        off: {
            QB: 1,
            RB: 0,
            WR: 5,
            TE: 0,
            OL: 5,
        },
        def: {
            DL: 4,
            LB: 1,
            CB: 4,
            S: 2,
        },
    },
];

const fieldGoal = [
    {
        off: {
            K: 1,
            P: 1,
            OL: 9,
        },
        def: {
            DL: 6,
            LB: 3,
            S: 2,
        },
    },
];

const kickoff = [
    {
        off: {
            K: 1,
            LB: 5,
            S: 3,
            CB: 2,
        },
        def: {
            KR: 2,
            LB: 5,
            S: 4,
        },
    },
];

const punt = [
    {
        off: {
            P: 1,
            RB: 1,
            OL: 7,
            CB: 2,
        },
        def: {
            PR: 1,
            DL: 6,
            S: 4,
        },
    },
];

export default {
    fieldGoal,
    kickoff,
    normal,
    punt,
};

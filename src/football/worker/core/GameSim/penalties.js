// @flow

const penalties = [
    {
        name: "Holding",
        side: "offense",
        playTypes: [
            "kickoff",
            "fieldGoal",
            "punt",
            "puntReturn",
            "pass",
            "run",
        ],
        probPerPlay: 0,
        numPerSeason: 709,
        yds: 10,
        posOdds: {
            OL: 0.83,
            TE: 0.1,
            WR: 0.05,
            RB: 0.02,
        },
        notBallCarrier: true,
        spotFoul: true,
    },
    {
        name: "False start",
        side: "offense",
        playTypes: ["beforeSnap"],
        probPerPlay: 0,
        numPerSeason: 560,
        yds: 5,
        posOdds: {
            OL: 0.92,
            TE: 0.05,
            WR: 0.02,
            RB: 0.01,
        },
    },
    {
        name: "Pass interference",
        side: "defense",
        playTypes: ["pass"],
        probPerPlay: 0,
        numPerSeason: 237,
        yds: 0,
        posOdds: {
            CB: 0.6,
            S: 0.3,
            LB: 0.1,
        },
        spotFoul: true,
    },
    {
        name: "Holding",
        side: "defense",
        playTypes: ["pass", "run"],
        probPerPlay: 0,
        numPerSeason: 236,
        yds: 5,
        posOdds: {
            DL: 0.25,
            LB: 0.25,
            S: 0.25,
            CB: 0.25,
        },
        automaticFirstDown: true,
    },
    {
        name: "Unnecessary roughness",
        side: "defense",
        playTypes: [
            "kickoff",
            "fieldGoal",
            "punt",
            "puntReturn",
            "pass",
            "run",
        ],
        probPerPlay: 0,
        numPerSeason: 150,
        yds: 15,
        posOdds: {
            DL: 0.25,
            LB: 0.25,
            S: 0.25,
            CB: 0.25,
        },
    },
    {
        name: "Unnecessary roughness",
        side: "offense",
        playTypes: [
            "kickoff",
            "fieldGoal",
            "punt",
            "puntReturn",
            "pass",
            "run",
        ],
        probPerPlay: 0,
        numPerSeason: 50,
        yds: 15,
        posOdds: {
            QB: 0.01,
            RB: 0.19,
            WR: 0.4,
            TE: 0.2,
            OL: 0.4,
        },
    },
    {
        name: "Illegal block in the back",
        side: "offense",
        playTypes: ["puntReturn"],
        probPerPlay: 0,
        numPerSeason: 184,
        yds: 10,
        posOdds: {
            DL: 0.4,
            S: 0.6,
        },
    },
    {
        name: "Neutral zone infraction",
        side: "defense",
        playTypes: ["beforeSnap"],
        probPerPlay: 0,
        numPerSeason: 143,
        yds: 5,
        posOdds: {
            DL: 0.85,
            LB: 0.15,
        },
    },
    {
        name: "Offsides",
        side: "defense",
        playTypes: ["fieldGoal", "punt", "puntReturn", "pass", "run"],
        probPerPlay: 0,
        numPerSeason: 143,
        yds: 5,
        posOdds: {
            DL: 0.85,
            LB: 0.15,
        },
    },
    {
        name: "Roughing the passer",
        side: "defense",
        playTypes: ["pass"],
        probPerPlay: 0,
        numPerSeason: 114,
        yds: 15,
        posOdds: {
            DL: 0.7,
            LB: 0.24,
            S: 0.04,
            CB: 0.02,
        },
    },
    {
        name: "Delay of game",
        side: "offense",
        playTypes: ["beforeSnap"],
        probPerPlay: 0,
        numPerSeason: 111,
        yds: 5,
    },
    {
        name: "Face mask",
        side: "defense",
        playTypes: ["pass", "run", "kickoff", "puntReturn"],
        probPerPlay: 0,
        numPerSeason: 80,
        yds: 15,
        posOdds: {
            LB: 0.6,
            DL: 0.2,
            S: 0.1,
            CB: 0.1,
        },
    },
    {
        name: "Face mask",
        side: "offense",
        playTypes: ["pass", "run", "kickoff", "puntReturn"],
        probPerPlay: 0,
        numPerSeason: 8,
        yds: 15,
        posOdds: {
            RB: 0.3,
            WR: 0.3,
            OL: 0.25,
            TE: 0.15,
        },
    },
];

// Total each season, to compare with penalty.numPerSeason for frequency calculation
const numPlays = {
    kickoff: 2500,
    punt: 2000,
    puntReturn: 2000,
    fieldGoal: 2000, // Includes extra points
    pass: 17500,
    run: 13000,
    beforeSnap: 0,
};
numPlays.beforeSnap =
    numPlays.punt + numPlays.fieldGoal + numPlays.pass + numPlays.run;

for (const pen of penalties) {
    const chances = pen.playTypes.reduce(
        (sum, playType) => sum + numPlays[playType],
        0,
    );
    pen.probPerPlay = pen.numPerSeason / chances;
}

export default penalties;

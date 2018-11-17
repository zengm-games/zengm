// @flow

const COMPOSITE_WEIGHTS = {
    pace: {
        ratings: ["spd", "jmp", "dnk", "tp", "drb", "pss"],
    },
    usage: {
        ratings: ["ins", "dnk", "fg", "tp", "spd", "hgt", "drb", "oiq"],
        weights: [1.5, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
    },
    dribbling: {
        ratings: ["drb", "spd"],
        weights: [1, 1],
    },
    passing: {
        ratings: ["drb", "pss", "oiq"],
        weights: [0.4, 1, 0.5],
    },
    turnovers: {
        ratings: [50, "ins", "pss", "oiq"],
        weights: [0.5, 1, 1, -1],
    },
    shootingAtRim: {
        ratings: ["hgt", "spd", "jmp", "dnk", "oiq"],
        weights: [0.75, 0.2, 0.6, 0.4, 0.2],
    },
    shootingLowPost: {
        ratings: ["hgt", "stre", "spd", "ins", "oiq"],
        weights: [2, 0.6, 0.2, 1, 0.2],
    },
    shootingMidRange: {
        ratings: ["oiq", "fg"],
        weights: [-0.5, 1],
    },
    shootingThreePointer: {
        ratings: ["oiq", "tp"],
        weights: [0.1, 1],
    },
    shootingFT: {
        ratings: ["ft"],
    },
    rebounding: {
        ratings: ["hgt", "stre", "jmp", "reb", "oiq", "diq"],
        weights: [2, 0.1, 0.1, 2, 0.5, 0.5],
    },
    stealing: {
        ratings: [50, "spd", "diq"],
        weights: [1, 1, 2],
    },
    blocking: {
        ratings: ["hgt", "jmp", "diq"],
        weights: [2.5, 1.5, 0.5],
    },
    fouling: {
        ratings: [50, "hgt", "diq", "spd"],
        weights: [3, 1, -1, -1],
    },
    drawingFouls: {
        ratings: ["hgt", "spd", "drb", "dnk", "oiq"],
        weights: [1, 1, 1, 1, 1],
    },
    defense: {
        ratings: ["hgt", "stre", "spd", "jmp", "diq"],
        weights: [1, 1, 1, 0.5, 2],
    },
    defenseInterior: {
        ratings: ["hgt", "stre", "spd", "jmp", "diq"],
        weights: [2.5, 1, 0.5, 0.5, 2],
    },
    defensePerimeter: {
        ratings: ["hgt", "stre", "spd", "jmp", "diq"],
        weights: [0.5, 0.5, 2, 0.5, 1],
    },
    endurance: {
        ratings: [50, "endu"],
        weights: [1, 1],
    },
    athleticism: {
        ratings: ["stre", "spd", "jmp", "hgt"],
        weights: [1, 1, 1, 0.75],
    },
};

export {
    // eslint-disable-next-line import/prefer-default-export
    COMPOSITE_WEIGHTS,
};

// @flow

const posRatings = (pos: string): string[] => {
    if (pos === "QB") {
        return ["thv", "thp", "tha", "bsc"];
    }

    if (pos === "RB" || pos === "WR") {
        return ["elu", "rtr", "hnd", "bsc"];
    }

    if (pos === "TE") {
        return ["elu", "rtr", "hnd", "rbk"];
    }

    if (pos === "OL") {
        return ["rbk", "pbk"];
    }

    if (pos === "DL" || pos === "LB" || pos === "CB" || pos === "S") {
        return ["pcv", "tck", "prs", "rns"];
    }

    if (pos === "K") {
        return ["kpw", "kac"];
    }

    if (pos === "P") {
        return ["ppw", "pac"];
    }

    return [];
};

export default posRatings;

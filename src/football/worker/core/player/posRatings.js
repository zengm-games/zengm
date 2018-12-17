// @flow

const posRatings = (pos: string): string[] => {
    if (pos === "QB") {
        return ["thv", "thp", "tha", "bls"];
    }

    if (pos === "RB" || pos === "WR" || pos === "TE") {
        return ["elu", "rtr", "hnd", "bls"];
    }

    if (pos === "C" || pos === "OL") {
        return ["rbk", "pbk", "snp"];
    }

    if (pos === "DL" || pos === "LB" || pos === "CB" || pos === "S") {
        return ["pcv", "prs", "rns", "hnd"];
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

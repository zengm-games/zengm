// @flow

//import { PLAYER } from "../../../../deion/common";
//import { helpers } from "../../../../deion/worker/util";
import type {
    PlayerStats,
    PlayerStatType,
} from "../../../../deion/common/types";

const percentage = (numerator, denominator) => {
    if (denominator > 0) {
        return (100 * numerator) / denominator;
    }

    return 0;
};

const qbRat = ps => {
    const a = (ps.pssCmp / ps.pss - 0.3) * 5;
    const b = (ps.pssYds / ps.pss - 3) * 0.25;
    const c = (ps.pssTD / ps.pss) * 20;
    const d = 2.375 - (ps.pssInt / ps.pss) * 25;

    return ((a + b + c + d) / 6) * 100;
};

const processStats = (
    ps: PlayerStats,
    stats: string[],
    statType?: PlayerStatType,
    bornYear?: number,
) => {
    const row = {};

    for (const stat of stats) {
        if (stat === "cmpPct") {
            row[stat] = percentage(ps.pssCmp, ps.pss);
        } else if (stat === "qbRat") {
            row[stat] = qbRat(ps);
        } else if (stat === "rusYdsPerAtt") {
            row[stat] = ps.rusYds / ps.rus;
        } else if (stat === "recYdsPerAtt") {
            row[stat] = ps.recYds / ps.rec;
        } else if (stat === "fg") {
            row[stat] = ps.fg0 + ps.fg20 + ps.fg30 + ps.fg40 + ps.fg50;
        } else if (stat === "fga") {
            row[stat] = ps.fga0 + ps.fga20 + ps.fga30 + ps.fga40 + ps.fga50;
        } else if (stat === "fgPct") {
            row[stat] = percentage(
                ps.fg0 + ps.fg20 + ps.fg30 + ps.fg40 + ps.fg50,
                ps.fga0 + ps.fga20 + ps.fga30 + ps.fga40 + ps.fga50,
            );
        } else if (stat === "xpPct") {
            row[stat] = percentage(ps.xp, ps.xpa);
        } else if (stat === "kickingPts") {
            row[stat] =
                3 * (ps.fg0 + ps.fg20 + ps.fg30 + ps.fg40 + ps.fg50) + ps.xp;
        } else if (stat === "pntYdsPerAtt") {
            row[stat] = ps.pntYds / ps.pnt;
        } else if (stat === "defTck") {
            row[stat] = ps.defTckSolo + ps.defTckAst;
        } else if (stat === "keyStats") {
            const defTck = ps.defTckSolo + ps.defTckAst;
            const fga = ps.fga0 + ps.fga20 + ps.fga30 + ps.fga40 + ps.fga50;

            const counts = {
                passer: ps.pss,
                rusher: ps.rus,
                receiver: ps.rec,
                defender: defTck,
                kicker: fga + ps.xpa,
                punter: ps.pnt,
            };

            let role;
            let max = 0;
            for (const [key, value] of Object.entries(counts)) {
                if (value > max) {
                    role = key;
                    max = value;
                }
            }

            if (role === "passer") {
                row[stat] = `${percentage(ps.pssCmp, ps.pss).toFixed(1)}%, ${
                    ps.pssYds
                } yards, ${ps.pssTD} TD, ${ps.pssInt} int, ${qbRat(ps).toFixed(
                    1,
                )} QBRat`;
            } else if (role === "rusher") {
                row[stat] = `${ps.rus} rushes, ${ps.rusYds} yards, ${(
                    ps.rusYds / ps.rus
                ).toFixed(1)} avg, ${ps.rusTD} TD`;
            } else if (role === "receiver") {
                row[stat] = `${ps.rec} catches, ${ps.recYds} yards, ${(
                    ps.recYds / ps.rec
                ).toFixed(1)} avg, ${ps.recTD} TD`;
            } else if (role === "defender") {
                row[stat] = `${defTck} tackles, ${ps.defSk} sacks, ${
                    ps.defPssDef
                } PD, ${ps.defInt} int`;
            } else if (role === "kicker") {
                const fgm = ps.fg0 + ps.fg20 + ps.fg30 + ps.fg40 + ps.fg50;
                row[stat] = `${fgm} FGs, ${percentage(fgm, fga).toFixed(1)}%`;
            } else if (role === "punter") {
                row[stat] = `${ps.pnt} punts, ${(ps.pntYds / ps.pnt).toFixed(
                    1,
                )} yards avg`;
            } else {
                row[stat] = "";
            }
        } else {
            row[stat] = ps[stat];
        }

        // For keepWithNoStats
        if (row[stat] === undefined || Number.isNaN(row[stat])) {
            row[stat] = 0;
        }
    }

    // Since they come in same stream, always need to be able to distinguish
    ps.playoffs = ps.playoffs;

    return row;
};

export default processStats;

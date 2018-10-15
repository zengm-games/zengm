import React from "react";
import { DataTable, PlayerNameLabels } from "../../components";
import { getCols, helpers } from "../../util";

const genPlayerRows = (players, handleToggle, userOrOther) => {
    return players.map(p => {
        return {
            key: p.pid,
            data: [
                <input
                    type="checkbox"
                    title={p.untradableMsg}
                    checked={p.selected}
                    disabled={p.untradable}
                    onChange={() => {
                        handleToggle(userOrOther, "player", p.pid);
                    }}
                />,
                <input
                    type="checkbox"
                    title="Exclude this player from counter offers"
                />,
                <PlayerNameLabels
                    injury={p.injury}
                    pid={p.pid}
                    skills={p.ratings.skills}
                    watch={p.watch}
                >
                    {p.name}
                </PlayerNameLabels>,
                p.ratings.pos,
                p.age,
                p.ratings.ovr,
                p.ratings.pot,
                <span>
                    {helpers.formatCurrency(p.contract.amount, "M")} thru{" "}
                    {p.contract.exp}
                </span>,
                p.stats.min.toFixed(1),
                p.stats.pts.toFixed(1),
                p.stats.trb.toFixed(1),
                p.stats.ast.toFixed(1),
                p.stats.per.toFixed(1),
            ],
        };
    });
};

const genPickRows = (picks, handleToggle, userOrOther) => {
    return picks.map(pick => {
        return {
            key: pick.dpid,
            data: [
                <input
                    name="other-dpids"
                    type="checkbox"
                    checked={pick.selected}
                    onChange={() => {
                        handleToggle(userOrOther, "pick", pick.dpid);
                    }}
                />,
                <input
                    type="checkbox"
                    title="Exclude this pick from counter offers"
                />,
                pick.desc,
            ],
        };
    });
};

const playerCols = getCols(
    "",
    "X",
    "Name",
    "Pos",
    "Age",
    "Ovr",
    "Pot",
    "Contract",
    "Min",
    "Pts",
    "Reb",
    "Ast",
    "PER",
);
playerCols[0].sortSequence = [];
playerCols[2].width = "100%";

const pickCols = getCols("", "X", "Draft Picks");
pickCols[0].sortSequence = [];
pickCols[2].width = "100%";

const AssetList = ({ handleToggle, picks, roster, userOrOther }) => {
    const playerRows = genPlayerRows(roster, handleToggle, userOrOther);
    const pickRows = genPickRows(picks, handleToggle, userOrOther);

    return (
        <div className="row">
            <div className="col-xl-9">
                <DataTable
                    cols={playerCols}
                    defaultSort={[5, "desc"]}
                    name={`Trade:${userOrOther}`}
                    rows={playerRows}
                />
            </div>
            <div className="col-xl-3">
                <DataTable
                    cols={pickCols}
                    disableSorting
                    defaultSort={[1, "asc"]}
                    name={`Trade:Picks:${userOrOther}`}
                    rows={pickRows}
                />
            </div>
        </div>
    );
};

export default AssetList;

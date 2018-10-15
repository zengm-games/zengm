import React from "react";
import {
    DataTable,
    ResponsiveTableWrapper,
    PlayerNameLabels,
} from "../../components";
import { getCols, helpers } from "../../util";

const genPlayerRows = (players, handleToggle) => {
    return players.map(p => {
        return {
            key: p.pid,
            data: [
                <input
                    type="checkbox"
                    value={p.pid}
                    title={p.untradableMsg}
                    checked={p.selected}
                    disabled={p.untradable}
                    onChange={handleToggle(p.pid)}
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

const genPickRows = (picks, handleToggle, dpidsSelected) => {
    return picks.map(pick => {
        return {
            key: pick.dpid,
            data: [
                <input
                    name="other-dpids"
                    type="checkbox"
                    value={pick.dpid}
                    checked={dpidsSelected.includes(pick.dpid)}
                    onChange={handleToggle(pick.dpid)}
                />,
                pick.desc,
            ],
        };
    });
};

const playerCols = getCols(
    "",
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
playerCols[1].width = "100%";

const pickCols = getCols("", "Draft Picks");
pickCols[0].sortSequence = [];
pickCols[1].width = "100%";

const AssetList = ({
    dpidsSelected,
    handlePickToggle,
    handlePlayerToggle,
    name,
    picks,
    roster,
}) => {
    const playerRows = genPlayerRows(roster, handlePlayerToggle);
    const pickRows = genPickRows(picks, handlePickToggle, dpidsSelected);

    return (
        <div className="row">
            <div className="col-xl-9">
                <DataTable
                    cols={playerCols}
                    defaultSort={[5, "desc"]}
                    name={name}
                    rows={playerRows}
                />
            </div>
            <div className="col-xl-3">
                <DataTable
                    cols={pickCols}
                    disableSorting
                    defaultSort={[1, "asc"]}
                    name={`${name}:Picks`}
                    rows={pickRows}
                />
            </div>
        </div>
    );
};

export default AssetList;

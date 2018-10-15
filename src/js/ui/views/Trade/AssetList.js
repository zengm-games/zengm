import React from "react";
import {
    DataTable,
    ResponsiveTableWrapper,
    PlayerNameLabels,
} from "../../components";
import { getCols, helpers } from "../../util";

const genRows = (players, handlePlayerToggle) => {
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
                    onChange={handlePlayerToggle(p.pid)}
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

const AssetList = ({
    dpidsSelected,
    handlePickToggle,
    handlePlayerToggle,
    name,
    picks,
    roster,
}) => {
    const playerRows = genRows(roster, handlePlayerToggle);

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
                <ResponsiveTableWrapper>
                    <table className="table table-striped table-bordered table-sm">
                        <thead>
                            <tr>
                                <th />
                                <th width="100%">Draft Picks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {picks.map(pick => (
                                <tr key={pick.dpid}>
                                    <td>
                                        <input
                                            name="other-dpids"
                                            type="checkbox"
                                            value={pick.dpid}
                                            checked={dpidsSelected.includes(
                                                pick.dpid,
                                            )}
                                            onChange={handlePickToggle(
                                                pick.dpid,
                                            )}
                                        />
                                    </td>
                                    <td>{pick.desc}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ResponsiveTableWrapper>
            </div>
        </div>
    );
};

export default AssetList;

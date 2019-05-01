import PropTypes from "prop-types";
import React from "react";
import {
    DataTable,
    DraftAbbrev,
    Dropdown,
    JumpTo,
    NewWindowLink,
    SkillsBlock,
} from "../components";
import { getCols, helpers, setTitle } from "../util";

const DraftSummary = ({ draftType, players, season, stats, userTid }) => {
    setTitle(`${season} Draft Summary`);

    const superCols = [
        {
            title: "",
            colspan: 3,
        },
        {
            title: "At Draft",
            colspan: 5,
        },
        {
            title: "Current",
            colspan: 5,
        },
        {
            title: "Career Stats",
            colspan: 7,
        },
    ];

    const cols = getCols(
        "Pick",
        "Name",
        "Pos",
        "Team",
        "Age",
        "Ovr",
        "Pot",
        "Skills",
        "Team",
        "Age",
        "Ovr",
        "Pot",
        "Skills",
        ...stats.map(stat => `stat:${stat}`),
    );

    const rows = players.map(p => {
        return {
            key: p.pid,
            data: [
                `${p.draft.round}-${p.draft.pick}`,
                <a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a>,
                p.pos,
                <DraftAbbrev
                    originalTid={p.draft.originalTid}
                    season={season}
                    tid={p.draft.tid}
                >
                    {p.draft.tid} {p.draft.originalTid}
                </DraftAbbrev>,
                p.draft.age,
                p.draft.ovr,
                p.draft.pot,
                <span className="skills-alone">
                    <SkillsBlock skills={p.draft.skills} />
                </span>,
                <a href={helpers.leagueUrl(["roster", p.currentAbbrev])}>
                    {p.currentAbbrev}
                </a>,
                p.currentAge,
                p.currentOvr,
                p.currentPot,
                <span className="skills-alone">
                    <SkillsBlock skills={p.currentSkills} />
                </span>,
                ...stats.map(stat =>
                    helpers.roundStat(p.careerStats[stat], stat),
                ),
            ],
            classNames: {
                "table-danger": p.hof,
                "table-info": p.draft.tid === userTid,
            },
        };
    });

    return (
        <>
            <Dropdown
                view="draft_summary"
                fields={["seasonsAndOldDrafts"]}
                values={[season]}
            />
            <JumpTo season={season} />
            <h1>
                {season} Draft Summary <NewWindowLink />
            </h1>

            <p>
                More:{" "}
                <a href={helpers.leagueUrl(["draft_scouting"])}>
                    Future Draft Scouting
                </a>{" "}
                |{" "}
                {draftType !== "noLottery" ? (
                    <>
                        <a href={helpers.leagueUrl(["draft_lottery", season])}>
                            Draft Lottery
                        </a>{" "}
                        |{" "}
                    </>
                ) : null}
                <a href={helpers.leagueUrl(["draft_team_history"])}>
                    Team History
                </a>
            </p>

            <p>
                Players drafted by your team are{" "}
                <span className="text-info">highlighted in blue</span>. Players
                in the Hall of Fame are{" "}
                <span className="text-danger">highlighted in red</span>.
            </p>

            <DataTable
                cols={cols}
                defaultSort={[0, "asc"]}
                name="DraftSummary"
                rows={rows}
                superCols={superCols}
            />
        </>
    );
};

DraftSummary.propTypes = {
    draftType: PropTypes.oneOf(["nba1994", "nba2019", "noLottery"]),
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    season: PropTypes.number.isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    userTid: PropTypes.number.isRequired,
};

export default DraftSummary;

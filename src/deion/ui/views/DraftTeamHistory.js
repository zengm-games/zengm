import PropTypes from "prop-types";
import React from "react";
import {
    DataTable,
    DraftAbbrev,
    Dropdown,
    NewWindowLink,
    SkillsBlock,
} from "../components";
import { getCols, helpers, setTitle } from "../util";

const DraftTeamHistory = ({
    abbrev,
    draftType,
    name,
    players,
    region,
    stats,
    userAbbrev,
}) => {
    setTitle(`${region} ${name} Draft History`);

    const superCols = [
        {
            title: "",
            colspan: 4,
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
        "Season",
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
                <a href={helpers.leagueUrl(["draft_summary", p.draft.year])}>
                    {p.draft.year}
                </a>,
                `${p.draft.round}-${p.draft.pick}`,
                <a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a>,
                p.pos,
                <DraftAbbrev
                    originalTid={p.draft.originalTid}
                    season={p.draft.year}
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
                "table-info": p.currentAbbrev === userAbbrev,
            },
        };
    });

    return (
        <>
            <Dropdown
                view="draft_team_history"
                fields={["teams"]}
                values={[abbrev]}
            />
            <h1>
                {region} {name} Draft History <NewWindowLink />
            </h1>

            <p>
                More:{" "}
                <a href={helpers.leagueUrl(["draft_scouting"])}>
                    Future Draft Scouting
                </a>{" "}
                |{" "}
                {draftType !== "noLottery" ? (
                    <>
                        <a href={helpers.leagueUrl(["draft_lottery"])}>
                            Draft Lottery
                        </a>{" "}
                        |{" "}
                    </>
                ) : null}
                <a href={helpers.leagueUrl(["draft_summary"])}>Draft Summary</a>
            </p>

            <p>
                Players currently on your team are{" "}
                <span className="text-info">highlighted in blue</span>. Players
                in the Hall of Fame are{" "}
                <span className="text-danger">highlighted in red</span>.
            </p>

            <DataTable
                cols={cols}
                defaultSort={[0, "desc"]}
                name="DraftTeamHistory"
                rows={rows}
                superCols={superCols}
                pagination
            />
        </>
    );
};

DraftTeamHistory.propTypes = {
    abbrev: PropTypes.string.isRequired,
    draftType: PropTypes.oneOf(["nba1994", "nba2019", "noLottery"]),
    name: PropTypes.string.isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    region: PropTypes.string.isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    userAbbrev: PropTypes.string.isRequired,
};

export default DraftTeamHistory;

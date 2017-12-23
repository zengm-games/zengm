import PropTypes from "prop-types";
import React from "react";
import { g, helpers } from "../../common";
import { getCols, setTitle } from "../util";
import {
    DataTable,
    DraftAbbrev,
    Dropdown,
    NewWindowLink,
    SkillsBlock,
} from "../components";

const DraftTeamHistory = ({ abbrev, players }) => {
    const tid = g.teamAbbrevsCache.indexOf(abbrev);
    const region = g.teamRegionsCache[tid];
    const name = g.teamNamesCache[tid];

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
        "G",
        "Min",
        "PPG",
        "Reb",
        "Ast",
        "PER",
        "EWA",
    );

    const userAbbrev = g.teamAbbrevsCache[g.userTid];

    const rows = players.map(p => {
        return {
            key: p.pid,
            data: [
                p.draft.year,
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
                p.careerStats.gp.toFixed(),
                p.careerStats.min.toFixed(1),
                p.careerStats.pts.toFixed(1),
                p.careerStats.trb.toFixed(1),
                p.careerStats.ast.toFixed(1),
                p.careerStats.per.toFixed(1),
                p.careerStats.ewa.toFixed(1),
            ],
            classNames: {
                danger: p.hof,
                info: p.currentAbbrev === userAbbrev,
            },
        };
    });

    return (
        <div>
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
                <a href={helpers.leagueUrl(["draft_lottery"])}>Draft Lottery</a>{" "}
                |{" "}
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
        </div>
    );
};

DraftTeamHistory.propTypes = {
    abbrev: PropTypes.string.isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default DraftTeamHistory;

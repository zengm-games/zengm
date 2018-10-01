import PropTypes from "prop-types";
import React from "react";
import { getCols, helpers, setTitle } from "../util";
import {
    DataTable,
    DraftAbbrev,
    Dropdown,
    JumpTo,
    NewWindowLink,
    SkillsBlock,
} from "../components";

const DraftSummary = ({ players, season, userTid }) => {
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
        "G",
        "Min",
        "PPG",
        "Reb",
        "Ast",
        "PER",
        "EWA",
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
                info: p.draft.tid === userTid,
            },
        };
    });

    return (
        <>
            <Dropdown
                view="draft_summary"
                fields={["seasons"]}
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
                <a href={helpers.leagueUrl(["draft_lottery", season])}>
                    Draft Lottery
                </a>{" "}
                |{" "}
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
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    season: PropTypes.number.isRequired,
    userTid: PropTypes.number.isRequired,
};

export default DraftSummary;

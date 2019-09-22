import PropTypes from "prop-types";
import React, { useCallback, useState } from "react";
import { DataTable, NewWindowLink, PlayerNameLabels } from "../components";
import { getCols, helpers, setTitle, toWorker } from "../util";

const PlayersTable = ({
    draftType,
    name,
    onDraft,
    pidsAdd,
    pidsRemove,
    players,
    remaining,
    stats,
    userTids,
    usersTurn,
}) => {
    const showDraftCol = draftType === "user" && name === "Remaining";

    const colNames = [
        "Name",
        "Team",
        "Age",
        "Ovr",
        ...stats.map(stat => `stat:${stat}`),
    ];
    if (showDraftCol) {
        colNames.unshift("Draft");
    }
    const cols = getCols(...colNames);

    const playersAugmented =
        !pidsAdd || pidsAdd.length === 0 || !remaining
            ? players
            : [
                  ...players,
                  ...pidsAdd.map(pid => {
                      const p = remaining.find(p2 => p2.pid === pid);
                      if (!p) {
                          throw new Error(`Player not found, pid ${pid}`);
                      }
                      return p;
                  }),
              ];

    const rows = playersAugmented
        .filter(p => {
            if (!pidsRemove) {
                return true;
            }
            return !pidsRemove.includes(p.pid);
        })
        .map(p => {
            const data = [
                <PlayerNameLabels
                    pid={p.pid}
                    injury={p.injury}
                    pos={p.ratings.pos}
                    skills={p.skills}
                    watch={p.watch}
                >
                    {p.name}
                </PlayerNameLabels>,
                p.abbrev,
                p.age,
                p.ratings.ovr,
                ...stats.map(stat => helpers.roundStat(p.stats[stat], stat)),
            ];
            if (showDraftCol) {
                data.unshift(
                    <button
                        className="btn btn-xs btn-primary"
                        disabled={!usersTurn}
                        onClick={() => {
                            onDraft(p.pid);
                        }}
                        title="Draft player"
                    >
                        Draft
                    </button>,
                );
            }

            return {
                key: p.pid,
                data,
                classNames: {
                    "table-danger": p.hof,
                    "table-info": userTids.includes(p.tid),
                },
            };
        });

    return (
        <DataTable
            cols={cols}
            defaultSort={[showDraftCol ? 4 : 3, "desc"]}
            name={`AllStars:${name}`}
            rows={rows}
        />
    );
};

PlayersTable.propTypes = {
    draftType: PropTypes.oneOf(["auto", "user"]).isRequired,
    name: PropTypes.string.isRequired,
    onDraft: PropTypes.func,
    pidsAdd: PropTypes.arrayOf(PropTypes.number),
    pidsRemove: PropTypes.arrayOf(PropTypes.number),
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    remaining: PropTypes.arrayOf(PropTypes.object),
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    userTids: PropTypes.arrayOf(PropTypes.number).isRequired,
    usersTurn: PropTypes.bool,
};

const wait = ms => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
};

const AllStars = ({
    finalized,
    remaining,
    stats,
    teams,
    teamNames,
    userTids,
}) => {
    const draftType = teams.some(t => userTids.includes(t[0].tid))
        ? "user"
        : "auto";

    const [started, setStarted] = useState(teams[0].length > 1);
    const [revealed, setRevealed] = useState([]);

    const reveal = useCallback(pid => {
        setRevealed(revealed2 => [...revealed2, pid]);
    }, []);

    const startDraft = useCallback(async () => {
        setStarted(true);

        if (draftType === "auto") {
            const pids = await toWorker("allStarDraftAll");
            for (const pid of pids) {
                if (pid !== pids[0]) {
                    await wait(500);
                }
                reveal(pid);
            }
            return;
        }

        if (!userTids.includes(teams[0][0].tid)) {
            const pid = await toWorker("allStarDraftOne");
            reveal(pid);
        }

        console.log("Prompt user to pick");
    }, [draftType, reveal, teams, userTids]);

    const onDraft = useCallback(
        async pid => {
            await toWorker("allStarDraftUser", pid);
            reveal(pid);
        },
        [reveal],
    );

    setTitle("All-Star Selections");

    // Split up revealed into the two teams
    const revealed0 = [];
    const revealed1 = [];
    let teamInd = teams[0].length > teams[1].length ? 1 : 0;
    for (const pid of revealed) {
        if (teamInd === 0) {
            revealed0.push(pid);
        } else {
            revealed1.push(pid);
        }
        teamInd = teamInd === 0 ? 1 : 0;
    }

    const usersTurn =
        started &&
        draftType === "user" &&
        ((teams[0].length > teams[1].length &&
            userTids.includes(teams[1][0].tid)) ||
            userTids.includes(teams[0][0].tid));

    return (
        <>
            <h1>
                All-Star Selections <NewWindowLink />
            </h1>
            <p>
                The top 24 players in the league play in an All-Star game. If
                any of them are injured, they are still All-Stars, but an
                additional All-Star will be selected as a replacement to play in
                the game.
            </p>
            <p>
                The players are split into two teams, captained by the top two
                players. The teams are filled by a draft. Just for fun, if a
                captain is on your team, you get to draft for him! Otherwise,
                the captains get to choose.
            </p>
            {!finalized && !started ? (
                <button
                    className="btn btn-lg btn-success mb-3"
                    onClick={startDraft}
                >
                    Start draft
                </button>
            ) : null}
            <div className="row">
                <div className="col-4">
                    <h3>{teamNames[0]}</h3>
                    <PlayersTable
                        draftType={draftType}
                        name="Team0"
                        pidsAdd={revealed0}
                        players={teams[0]}
                        remaining={remaining}
                        stats={stats}
                        userTids={userTids}
                    />
                </div>
                <div className="col-4">
                    <h3>{teamNames[1]}</h3>
                    <PlayersTable
                        draftType={draftType}
                        name="Team1"
                        pidsAdd={revealed1}
                        players={teams[1]}
                        remaining={remaining}
                        stats={stats}
                        userTids={userTids}
                    />
                </div>
                <div className="col-4">
                    <h3>Remaining All Stars</h3>
                    <PlayersTable
                        draftType={draftType}
                        name="Remaining"
                        onDraft={onDraft}
                        pidsRemove={revealed}
                        players={remaining}
                        stats={stats}
                        userTids={userTids}
                        usersTurn={usersTurn}
                    />
                </div>
            </div>
        </>
    );
};

AllStars.propTypes = {
    finalized: PropTypes.bool.isRequired,
    remaining: PropTypes.arrayOf(PropTypes.object).isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    teamNames: PropTypes.arrayOf(PropTypes.string).isRequired,
    teams: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
    userTids: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default AllStars;

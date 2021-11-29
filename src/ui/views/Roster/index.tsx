import classNames from "classnames";
import PropTypes from "prop-types";
import { useState } from "react";
import { arrayMoveImmutable } from "array-move";
import { isSport, PHASE, PLAYER, WEBSITE_ROOT } from "../../../common";
import {
	CountryFlag,
	HelpPopover,
	Mood,
	PlayerNameLabels,
	RatingWithChange,
	SortableTable,
	SafeHtml,
	MoreLinks,
} from "../../components";
import useTitleBar from "../../hooks/useTitleBar";
import { confirm, getCols, helpers, logEvent, toWorker } from "../../util";
import PlayingTime, { ptStyles } from "./PlayingTime";
import TopStuff from "./TopStuff";
import type { Phase, Player, View } from "../../../common/types";
import RosterCustomizeColumns from "./RosterCustomizeColumns";
import { ColTemp } from "../../util/columns/getCols";
import getTemplate from "../../util/columns/getTemplate";

// If a player was just drafted and the regular season hasn't started, then he can be released without paying anything
const justDrafted = (
	p: View<"roster">["players"][number],
	phase: Phase,
	season: number,
) => {
	return (
		p.contract.rookie &&
		((p.draft.year === season && phase >= PHASE.DRAFT) ||
			(p.draft.year === season - 1 &&
				phase < PHASE.REGULAR_SEASON &&
				phase >= 0))
	);
};

const handleRelease = async (
	p: View<"roster">["players"][number],
	phase: Phase,
	season: number,
) => {
	const wasPlayerJustDrafted = justDrafted(p, phase, season);

	let releaseMessage;
	if (wasPlayerJustDrafted) {
		releaseMessage = `Are you sure you want to release ${p.name}?  He will become a free agent and no longer take up a roster spot on your team. Because you just drafted him and the regular season has not started yet, you will not have to pay his contract.`;
	} else {
		releaseMessage = `Are you sure you want to release ${p.name}?  He will become a free agent and no longer take up a roster spot on your team, but you will still have to pay his salary (and have it count against the salary cap) until his contract expires in ${p.contract.exp}.`;
	}

	const proceed = await confirm(releaseMessage, {
		okText: "Release Player",
	});
	if (proceed) {
		const errorMsg = await toWorker(
			"main",
			"releasePlayer",
			p.pid,
			wasPlayerJustDrafted,
		);
		if (errorMsg) {
			logEvent({
				type: "error",
				text: errorMsg,
				saveToDb: false,
			});
		}
	}
};

const Roster = ({
	abbrev,
	budget,
	challengeNoRatings,
	currentSeason,
	editable,
	godMode,
	hardCap,
	maxRosterSize,
	numConfs,
	numPlayersOnCourt,
	numPlayoffRounds,
	payroll,
	phase,
	players,
	playoffs,
	salaryCap,
	season,
	showSpectatorWarning,
	showRelease,
	showTradeFor,
	showTradingBlock,
	t,
	tid,
	userTid,
	config,
}: View<"roster">) => {
	const [sortedPids, setSortedPids] = useState<number[] | undefined>(undefined);
	const [prevPlayers, setPrevPlayers] = useState(players);
	const [showColumnsModal, setShowColumnsModal] = useState(false);

	useTitleBar({
		title: "Roster",
		dropdownView: "roster",
		dropdownFields: {
			teams: abbrev,
			seasons: season,
			playoffs,
		},
		moreInfoAbbrev: abbrev,
		moreInfoSeason: season,
		moreInfoTid: tid,
	});

	if (players !== prevPlayers) {
		setSortedPids(undefined);
		setPrevPlayers(players);
	}

	// Use the result of drag and drop to sort players, before the "official" order comes back as props
	let playersSorted: typeof players;
	if (sortedPids !== undefined) {
		playersSorted = sortedPids.map(pid => {
			return players.find(p => p.pid === pid);
		});
	} else {
		playersSorted = players;
	}

	const profit = t.seasonAttrs !== undefined ? t.seasonAttrs.profit : 0;

	const cols: ColTemp[] = config.columns;
	const vars = {
		userTid,
		showTradeFor,
		handleTrade: (p: Player) => {
			if (showTradeFor) {
				toWorker("actions", "tradeFor", { pid: p.pid });
			} else {
				toWorker("actions", "addToTradingBlock", p.pid);
			}
		},
		handleRelease: (p: Player) => handleRelease(p, phase, season),
	};

	return (
		<>
			<MoreLinks
				type="team"
				page="roster"
				abbrev={abbrev}
				tid={tid}
				season={season}
			/>

			<TopStuff
				abbrev={abbrev}
				budget={budget}
				challengeNoRatings={challengeNoRatings}
				currentSeason={currentSeason}
				editable={editable}
				godMode={godMode}
				numConfs={numConfs}
				numPlayoffRounds={numPlayoffRounds}
				openRosterSpots={maxRosterSize - players.length}
				players={players}
				season={season}
				payroll={payroll}
				profit={profit}
				salaryCap={salaryCap}
				showTradeFor={showTradeFor}
				showTradingBlock={showTradingBlock}
				t={t}
				tid={tid}
			/>

			<button
				className="btn btn-primary"
				onClick={() => setShowColumnsModal(true)}
			>
				Columns
			</button>

			<RosterCustomizeColumns
				config={config}
				show={showColumnsModal}
				onHide={() => location.reload()}
			/>

			{showSpectatorWarning ? (
				<p className="alert alert-danger d-inline-block">
					The AI will handle roster management in spectator mode.
				</p>
			) : null}

			<div className="clearfix" />

			<SortableTable
				disabled={!editable}
				values={playersSorted}
				highlightHandle={({ index }) => index < numPlayersOnCourt}
				rowClassName={({ index, value: p }) =>
					classNames({
						separator:
							(isSport("basketball") && index === numPlayersOnCourt - 1) ||
							(!isSport("basketball") &&
								playersSorted[index + 1] &&
								p.ratings.pos !== playersSorted[index + 1].ratings.pos),
						"table-danger": p.hof,
						"table-info": p.tid === tid && season !== currentSeason,
					})
				}
				onChange={async ({ oldIndex, newIndex }) => {
					if (oldIndex === newIndex) {
						return;
					}
					const pids = players.map(p => p.pid);
					const newSortedPids = arrayMoveImmutable(pids, oldIndex, newIndex);
					setSortedPids(newSortedPids);
					await toWorker("main", "reorderRosterDrag", newSortedPids);
				}}
				onSwap={async (index1, index2) => {
					const newSortedPids = players.map(p => p.pid);
					newSortedPids[index1] = players[index2].pid;
					newSortedPids[index2] = players[index1].pid;
					setSortedPids(newSortedPids);
					await toWorker("main", "reorderRosterDrag", newSortedPids);
				}}
				cols={() => (
					<>
						{cols.map(({ desc, title }) => (
							<th key={title} title={desc}>
								{title}
							</th>
						))}
					</>
				)}
				row={({ value: p }) =>
					cols.map(col => <td key={col.title}>{getTemplate(p, col, vars)}</td>)
				}
			/>
		</>
	);
};

Roster.propTypes = {
	abbrev: PropTypes.string.isRequired,
	budget: PropTypes.bool.isRequired,
	currentSeason: PropTypes.number.isRequired,
	editable: PropTypes.bool.isRequired,
	maxRosterSize: PropTypes.number.isRequired,
	numConfs: PropTypes.number.isRequired,
	numPlayoffRounds: PropTypes.number.isRequired,
	payroll: PropTypes.number,
	phase: PropTypes.number.isRequired,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	salaryCap: PropTypes.number.isRequired,
	season: PropTypes.number.isRequired,
	showRelease: PropTypes.bool.isRequired,
	showTradeFor: PropTypes.bool.isRequired,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
	t: PropTypes.object.isRequired,
	userTid: PropTypes.number.isRequired,
};

export default Roster;

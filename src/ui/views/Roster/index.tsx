import classNames from "classnames";
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
import type { Phase, View } from "../../../common/types";

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
		const errorMsg = await toWorker("main", "releasePlayer", {
			pid: p.pid,
			justDrafted: wasPlayerJustDrafted,
		});
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
	maxRosterSize,
	numConfs,
	numPlayersOnCourt,
	numPlayoffRounds,
	payroll,
	phase,
	players,
	playoffs,
	salaryCap,
	salaryCapType,
	season,
	showSpectatorWarning,
	showRelease,
	showTradeFor,
	showTradingBlock,
	stats,
	t,
	tid,
	userTid,
}: View<"roster">) => {
	const [sortedPids, setSortedPids] = useState<number[] | undefined>(undefined);
	const [prevPlayers, setPrevPlayers] = useState(players);

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

	const statCols = getCols(stats.map(stat => `stat:${stat}`));

	const showMood = season === currentSeason;

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
				salaryCapType={salaryCapType}
				showTradeFor={showTradeFor}
				showTradingBlock={showTradingBlock}
				t={t}
				tid={tid}
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
						<th>Name</th>
						<th title="Position">Pos</th>
						<th>Age</th>
						<th title="Overall Rating">Ovr</th>
						<th title="Potential Rating">Pot</th>
						{season === currentSeason ? <th>Contract</th> : null}
						<th title="Years With Team">YWT</th>
						<th title="Country"></th>
						{statCols.map(({ desc, title }) => (
							<th key={title} title={desc}>
								{title}
							</th>
						))}
						{editable ? (
							<th title="Playing Time Modifier">
								PT{" "}
								<HelpPopover title="Playing Time Modifier">
									<p>
										Your coach will divide up playing time based on ability and
										stamina. If you want to influence his judgement, your
										options are:
									</p>
									<p>
										<span style={ptStyles["0"]}>0 No Playing Time</span>
										<br />
										<span style={ptStyles["0.75"]}>- Less Playing Time</span>
										<br />
										<span style={ptStyles["1"]}>
											&nbsp;&nbsp;&nbsp; Let Coach Decide
										</span>
										<br />
										<span style={ptStyles["1.25"]}>+ More Playing Time</span>
										<br />
										<span style={ptStyles["1.5"]}>
											++ Even More Playing Time
										</span>
									</p>
								</HelpPopover>
							</th>
						) : null}
						{showMood ? (
							<th>
								Mood{" "}
								<HelpPopover title="Player Mood">
									See{" "}
									<a
										href={`https://${WEBSITE_ROOT}/manual/player-mood/`}
										rel="noopener noreferrer"
										target="_blank"
									>
										the manual
									</a>{" "}
									for more info about player mood.
								</HelpPopover>
							</th>
						) : null}
						{showRelease ? (
							<th>
								Release{" "}
								<HelpPopover title="Release Player">
									<p>
										To free up a roster spot, you can release a player from your
										team. You will still have to pay his salary (and have it
										count against the salary cap) until his contract expires
										(you can view your released players' contracts in your{" "}
										<a href={helpers.leagueUrl(["team_finances"])}>
											Team Finances
										</a>
										).
									</p>
									{salaryCapType === "soft" ? (
										<p>
											However, if you just drafted a player and the regular
											season has not started yet, his contract is not guaranteed
											and you can release him for free.
										</p>
									) : null}
								</HelpPopover>
							</th>
						) : null}
						{showTradeFor || showTradingBlock ? <th>Trade</th> : null}
						<th title="How Player Was Acquired">Acquired</th>
					</>
				)}
				row={({ value: p }) => {
					const showRatings = !challengeNoRatings || p.tid === PLAYER.RETIRED;
					return (
						<>
							<td>
								<PlayerNameLabels
									pid={p.pid}
									injury={p.injury}
									jerseyNumber={p.stats.jerseyNumber}
									season={season}
									skills={p.ratings.skills}
									watch={p.watch}
								>
									{p.name}
								</PlayerNameLabels>
							</td>
							<td>{p.ratings.pos}</td>
							<td>{p.age}</td>
							<td>
								{showRatings ? (
									<RatingWithChange change={p.ratings.dovr}>
										{p.ratings.ovr}
									</RatingWithChange>
								) : null}
							</td>
							<td>
								{showRatings ? (
									<RatingWithChange change={p.ratings.dpot}>
										{p.ratings.pot}
									</RatingWithChange>
								) : null}
							</td>
							{season === currentSeason ? (
								<td
									style={{
										fontStyle: justDrafted(p, phase, currentSeason)
											? "italic"
											: "normal",
									}}
									title={
										justDrafted(p, phase, currentSeason)
											? "Contracts for drafted players are not guaranteed until the regular season. If you release a drafted player before then, you pay nothing."
											: undefined
									}
								>
									{helpers.formatCurrency(p.contract.amount, "M")} thru{" "}
									{p.contract.exp}
								</td>
							) : null}
							<td>{playoffs === "playoffs" ? null : p.stats.yearsWithTeam}</td>
							<td>
								<a
									href={helpers.leagueUrl([
										"frivolities",
										"most",
										"country",
										window.encodeURIComponent(helpers.getCountry(p.born.loc)),
									])}
								>
									<CountryFlag country={p.born.loc} />
								</a>
							</td>
							{stats.map(stat => (
								<td key={stat}>{helpers.roundStat(p.stats[stat], stat)}</td>
							))}
							{editable ? (
								<td>
									<PlayingTime p={p} userTid={userTid} />
								</td>
							) : null}
							{showMood ? (
								<td>
									<Mood defaultType="current" maxWidth p={p} />
								</td>
							) : null}
							{showRelease ? (
								<td>
									<button
										className="btn btn-light-bordered btn-xs"
										disabled={!p.canRelease}
										onClick={() => handleRelease(p, phase, currentSeason)}
									>
										Release
									</button>
								</td>
							) : null}
							{showTradeFor || showTradingBlock ? (
								<td title={p.untradableMsg}>
									<button
										className="btn btn-light-bordered btn-xs"
										disabled={p.untradable}
										onClick={() => {
											if (showTradeFor) {
												toWorker("actions", "tradeFor", { pid: p.pid });
											} else {
												toWorker("actions", "addToTradingBlock", p.pid);
											}
										}}
									>
										{showTradeFor ? "Trade For" : "Trade Away"}
									</button>
								</td>
							) : null}
							<td>
								<SafeHtml dirty={p.latestTransaction} />
							</td>
						</>
					);
				}}
			/>
		</>
	);
};

export default Roster;

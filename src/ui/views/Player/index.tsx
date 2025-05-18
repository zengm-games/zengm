import {
	DataTable,
	InjuryIcon,
	SafeHtml,
	SkillsBlock,
} from "../../components/index.tsx";
import Injuries from "./Injuries.tsx";
import useTitleBar from "../../hooks/useTitleBar.tsx";
import { getCols, helpers, groupAwards } from "../../util/index.ts";
import type { View } from "../../../common/types.ts";
import SeasonIcons from "./SeasonIcons.tsx";
import TopStuff from "./TopStuff.tsx";
import { PLAYER } from "../../../common/index.ts";
import HideableSection from "../../components/HideableSection.tsx";
import { StatsTable } from "./StatsTable.tsx";
import { highlightLeaderText, MaybeBold, SeasonLink } from "./common.tsx";
import { wrappedTeamAbbrevLink } from "../../components/TeamAbbrevLink.tsx";

const Player2 = ({
	bestPos,
	currentSeason,
	customMenu,
	events,
	feats,
	freeAgent,
	gender,
	godMode,
	injured,
	jerseyNumberInfos,
	leaders,
	phase,
	player,
	randomDebutsForeverPids,
	ratings,
	retired,
	showContract,
	showRatings,
	showTradeFor,
	showTradingBlock,
	spectator,
	statTables,
	statSummary,
	teamColors,
	teamJersey,
	teamName,
	teamURL,
	userTid,
	willingToSign,
}: View<"player">) => {
	useTitleBar({
		title: player.name,
		customMenu,
		dropdownView: "player",
		dropdownFields:
			player.tid !== PLAYER.UNDRAFTED
				? {
						playerProfile: "overview",
					}
				: undefined,
		dropdownCustomURL: (fields) => {
			let gameLogSeason;
			if (player.stats.length > 0) {
				gameLogSeason = player.stats.at(-1)!.season;
			} else if (player.ratings.length > 0) {
				gameLogSeason = player.ratings.at(-1)!.season;
			} else {
				gameLogSeason = currentSeason;
			}

			const parts =
				fields.playerProfile === "gameLog"
					? ["player_game_log", player.pid, gameLogSeason]
					: ["player", player.pid];

			return helpers.leagueUrl(parts);
		},
	});

	const awardsGrouped = groupAwards(player.awards);

	let hasLeader = false;
	for (const row of Object.values(leaders)) {
		if (row && (row.attrs.has("age") || row.ratings.size > 0)) {
			hasLeader = true;
			break;
		}
	}

	return (
		<>
			<TopStuff
				bestPos={bestPos}
				currentSeason={currentSeason}
				freeAgent={freeAgent}
				gender={gender}
				godMode={godMode}
				injured={injured}
				jerseyNumberInfos={jerseyNumberInfos}
				phase={phase}
				player={player}
				randomDebutsForeverPids={randomDebutsForeverPids}
				retired={retired}
				showContract={showContract}
				showRatings={showRatings}
				showTradeFor={showTradeFor}
				showTradingBlock={showTradingBlock}
				spectator={spectator}
				statSummary={statSummary}
				teamColors={teamColors}
				teamJersey={teamJersey}
				teamName={teamName}
				teamURL={teamURL}
				userTid={userTid}
				willingToSign={willingToSign}
			/>

			{statTables.map(({ name, onlyShowIf, stats, superCols }) => (
				<StatsTable
					key={name}
					name={name}
					onlyShowIf={onlyShowIf}
					stats={stats}
					superCols={superCols}
					p={player}
					leaders={leaders}
				/>
			))}

			<HideableSection
				title="Ratings"
				description={hasLeader && showRatings ? highlightLeaderText : null}
			>
				<DataTable
					className="mb-3 datatable-negative-margin-top"
					cols={getCols([
						"Year",
						"Team",
						"Age",
						"Pos",
						"Ovr",
						"Pot",
						...ratings.map((rating) => `rating:${rating}`),
						"Skills",
					])}
					defaultSort={[0, "asc"]}
					defaultStickyCols={2}
					hideAllControls
					name="Player:Ratings"
					rows={player.ratings.map((r, i) => {
						return {
							key: i,
							data: [
								{
									searchValue: r.season,
									sortValue: i,
									value: (
										<>
											<SeasonLink pid={player.pid} season={r.season} />{" "}
											<SeasonIcons season={r.season} awards={player.awards} />
											{r.injuryIndex !== undefined &&
											player.injuries[r.injuryIndex] ? (
												<InjuryIcon
													injury={{
														type: player.injuries[r.injuryIndex].type,
														gamesRemaining: -1,
													}}
												/>
											) : null}
										</>
									),
								},
								wrappedTeamAbbrevLink({
									abbrev: r.abbrev,
									season: r.season,
									tid: r.tid,
								}),
								<MaybeBold bold={leaders[r.season]?.attrs.has("age")}>
									{r.age}
								</MaybeBold>,
								r.pos,
								showRatings ? (
									<MaybeBold bold={leaders[r.season]?.ratings.has("ovr")}>
										{r.ovr}
									</MaybeBold>
								) : null,
								showRatings ? (
									<MaybeBold bold={leaders[r.season]?.ratings.has("pot")}>
										{r.pot}
									</MaybeBold>
								) : null,
								...ratings.map((rating) =>
									showRatings ? (
										<MaybeBold bold={leaders[r.season]?.ratings.has(rating)}>
											{(r as any)[rating]}
										</MaybeBold>
									) : null,
								),
								<SkillsBlock className="skills-alone" skills={r.skills} />,
							],
						};
					})}
				/>
			</HideableSection>

			<div className="row">
				<div className="col-6 col-md-3">
					<HideableSection title="Awards">
						{awardsGrouped.length > 0 ? (
							<table className="table table-nonfluid table-striped table-borderless table-sm player-awards">
								<tbody>
									{awardsGrouped.map((a, i) => {
										return (
											<tr key={i}>
												<td>
													{a.count > 1 ? `${a.count}x ` : null}
													{a.type} ({a.seasons.join(", ")})
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						) : null}
						{awardsGrouped.length === 0 ? <p>None</p> : null}
					</HideableSection>
				</div>
				<div className="col-6 col-md-3">
					<HideableSection title="Salaries">
						<DataTable
							className="datatable-negative-margin-top mb-3"
							cols={getCols(["Year", "Amount"])}
							defaultSort={[0, "asc"]}
							footer={{
								data: [
									"Total",
									helpers.formatCurrency(player.salariesTotal, "M"),
								],
							}}
							hideAllControls
							name="Player:Salaries"
							rows={player.salaries.map((s, i) => {
								return {
									key: i,
									data: [
										{
											searchValue: s.season,
											sortValue: i,
											value: (
												<>
													<SeasonLink pid={player.pid} season={s.season} />{" "}
													<SeasonIcons
														season={s.season}
														awards={player.awards}
													/>
												</>
											),
										},
										helpers.formatCurrency(s.amount, "M"),
									],
								};
							})}
						/>
					</HideableSection>
				</div>
				<div className="col-md-6">
					<HideableSection title="Statistical Feats">
						<div
							className="small-scrollbar"
							style={{
								maxHeight: 500,
								overflowY: "auto",
							}}
						>
							{feats.map((e) => {
								return (
									<p key={e.eid}>
										<b>{e.season}</b>: <SafeHtml dirty={e.text} />
									</p>
								);
							})}
						</div>
						{feats.length === 0 ? <p>None</p> : null}
					</HideableSection>
				</div>
			</div>

			<div className="row" style={{ marginBottom: "-1rem" }}>
				<div className="col-md-6 col-lg-4">
					<HideableSection title="Injuries">
						<Injuries injuries={player.injuries} showRatings={showRatings} />
					</HideableSection>
				</div>
				<div className="col-md-6 col-lg-8">
					<HideableSection title="Transactions">
						{events.map((e) => {
							return (
								<p key={e.eid}>
									<b>{e.season}</b>: <SafeHtml dirty={e.text} />
								</p>
							);
						})}
						{events.length === 0 ? <p>None</p> : null}
					</HideableSection>
				</div>
			</div>
		</>
	);
};

export default Player2;

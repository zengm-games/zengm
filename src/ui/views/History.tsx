import { MoreLinks } from "../components/MoreLinks.tsx";
import { RetiredPlayers } from "../components/RetiredPlayers.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import type { View } from "../../common/types.ts";
import { useLocal } from "../util/local.ts";
import { helpers } from "../util/helpers.ts";
import React from "react";
import { showStatsByType } from "../../common/awards.ts";
import { getCol } from "../../common/getCol.ts";
import { TEAM_AWARD_INFO } from "../../common/constants.ts";

type ActualProps = Exclude<
	View<"history">,
	{ invalidSeason: true; season: number }
>;

const SHOW_POS = TEAM_AWARD_INFO.byPos;

const Winner = ({
	award,
	season,
	userTid,
}: {
	award: ActualProps["awards"]["individualAwards"][number];
	season: number;
	userTid: number;
}) => {
	const stats = showStatsByType[award.showStats];
	if (!stats) {
		throw new Error("Invalid showStats");
	}

	const p = award.winner;
	if (!p) {
		return "???";
	}

	return (
		<>
			<span className={p.stats.tid === userTid ? "table-info" : undefined}>
				{SHOW_POS ? `${p.pos} ` : null}
				<b>
					<a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a>
				</b>{" "}
				(
				<a
					href={helpers.leagueUrl([
						"roster",
						`${p.stats.abbrev}_${p.stats.tid}`,
						season,
					])}
				>
					{p.stats.abbrev}
				</a>
				)
			</span>
			<br />
			{stats
				.map(
					(stat) =>
						`${helpers.roundStat(p.stats[stat], stat)}${stat === "keyStats" ? "" : ` ${getCol(`stat:${stat}`).title}`}`,
				)
				.join(", ")}
		</>
	);
};

const Teams = ({
	award,
	season,
	userTid,
}: {
	award: ActualProps["awards"]["teamAwards"][number];
	season: number;
	userTid: number;
}) => {
	const multipleTeams = award.winner.length > 1;

	return (
		<>
			{multipleTeams ? <h2>{award.name}</h2> : null}
			{award.winner.map((t, i) => {
				if (t.length === 0) {
					return null;
				}

				return (
					<div key={i} className="mb-3">
						{multipleTeams ? (
							<h3>{helpers.ordinal(i + 1)} team</h3>
						) : (
							<h2>{award.name} team</h2>
						)}
						{t.map((p, i) => {
							return (
								<div key={i}>
									{p ? (
										<span
											className={
												p.stats.tid === userTid ? "table-info" : undefined
											}
										>
											<a href={helpers.leagueUrl(["player", p.pid])}>
												{p.name}
											</a>{" "}
											(
											<a
												href={helpers.leagueUrl([
													"roster",
													`${p.stats.abbrev}_${p.stats.tid}`,
													season,
												])}
											>
												{p.stats.abbrev}
											</a>
											)
										</span>
									) : (
										"???"
									)}
								</div>
							);
						})}
					</div>
				);
			})}
		</>
	);
};

const splitTeamAwards = <T extends { numTeams: number }>(teamAwards: T[]) => {
	let sum = 0;
	for (const row of teamAwards) {
		sum += row.numTeams;
	}
	const target = Math.ceil(sum);
	const teamAwards1: T[] = [];
	const teamAwards2: T[] = [];

	let sum2 = 0;
	for (const row of teamAwards) {
		sum2 += row.numTeams;
		if (teamAwards1.length === 0 || sum2 > target) {
			teamAwards1.push(row);
		} else {
			teamAwards2.push(row);
		}
	}

	return { teamAwards1, teamAwards2 };
};

const History = (props: View<"history">) => {
	const { invalidSeason, season } = props;

	useTitleBar({
		title: "Season Summary",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "history",
		dropdownFields: {
			seasonsHistory: season,
		},
	});
	const { userTid } = useLocal(["userTid"]);

	if (invalidSeason) {
		return (
			<>
				<h2>Error</h2>
				<p>Invalid season.</p>
			</>
		);
	}

	const { awards, champ, confs, retiredPlayers, retiredStat } = props;

	const { teamAwards1, teamAwards2 } = splitTeamAwards(awards.teamAwards);

	return (
		<>
			<MoreLinks type="awards" page="history" season={season} />

			<div className="row">
				<div className="col-md-3 col-sm-4 col-12">
					<div className="row">
						<div className="col-sm-12 col-6">
							<h2>League Champs</h2>
							{champ ? (
								<div>
									<p>
										<span
											className={
												champ.tid === userTid ? "table-info" : undefined
											}
										>
											<b>
												<a
													href={helpers.leagueUrl([
														"roster",
														`${champ.seasonAttrs.abbrev}_${champ.tid}`,
														season,
													])}
												>
													{champ.seasonAttrs.region} {champ.seasonAttrs.name}
												</a>
											</b>
										</span>
										<br />
										<a href={helpers.leagueUrl(["playoffs", season])}>
											Playoff bracket
										</a>
									</p>
									{awards.individualAwardsPlayoffs.map((award, i) => {
										return (
											<React.Fragment key={i}>
												<p>
													{award.name}:{" "}
													<Winner
														award={award}
														season={awards.season}
														userTid={userTid}
													/>
												</p>
											</React.Fragment>
										);
									})}
								</div>
							) : (
								<p>???</p>
							)}
							<h2>Best Record</h2>
							{Array.from(awards.bestRecordConfs.entries()).map(([cid, t]) =>
								t ? (
									<p key={cid}>
										{confs[cid]?.name}:<br />
										<span
											className={t.tid === userTid ? "table-info" : undefined}
										>
											<a
												href={helpers.leagueUrl([
													"roster",
													`${t.seasonAttrs.abbrev}_${t.tid}`,
													season,
												])}
											>
												{t.seasonAttrs.region} {t.seasonAttrs.name}
											</a>{" "}
											({helpers.formatRecord(t.seasonAttrs)})
										</span>
										<br />
									</p>
								) : null,
							)}
						</div>
						<div className="col-sm-12 col-6">
							{awards.individualAwards.map((award, i) => {
								return (
									<React.Fragment key={i}>
										<h2>{award.name}</h2>
										<p>
											<Winner
												award={award}
												season={awards.season}
												userTid={userTid}
											/>
										</p>
									</React.Fragment>
								);
							})}
						</div>
					</div>
				</div>
				<div className="col-xl-2 col-md-3 col-sm-4 col-6">
					{teamAwards1.map((award, i) => {
						return (
							<Teams
								key={i}
								award={award}
								season={awards.season}
								userTid={userTid}
							/>
						);
					})}
				</div>
				<div className="col-xl-2 col-md-3 col-sm-4 col-6">
					{teamAwards2.map((award, i) => {
						return (
							<Teams
								key={i}
								award={award}
								season={awards.season}
								userTid={userTid}
							/>
						);
					})}
				</div>
				<div className="col-xl-5 col-md-3 col-sm-12">
					<RetiredPlayers
						retiredPlayers={retiredPlayers}
						retiredStat={retiredStat}
						season={season}
						userTid={userTid}
					/>
				</div>
			</div>
		</>
	);
};

export default History;

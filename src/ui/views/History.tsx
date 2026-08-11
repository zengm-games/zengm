import { MoreLinks } from "../components/MoreLinks.tsx";
import { RetiredPlayers } from "../components/RetiredPlayers.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import type { View } from "../../common/types.ts";
import { useLocal } from "../util/local.ts";
import { helpers } from "../util/helpers.ts";
import React from "react";
import { showStatsByType } from "../../common/awards.ts";

type ActualProps = Exclude<
	View<"history">,
	{ invalidSeason: true; season: number }
>;

const Winner = ({
	award,
	season,
	userTid,
}: {
	award: ActualProps["awards"]["individualAwards"][number];
	season: number;
	userTid: number;
}) => {
	if (!award) {
		return "???";
	}

	const stats = showStatsByType[award.showStats];
	if (!stats) {
		throw new Error("Invalid showStats");
	}

	const p = award.winner;

	return (
		<>
			<span className={p.tid === userTid ? "table-info" : undefined}>
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
				.map((stat) => `${helpers.roundStat(p.stats[stat], stat)} ${stat}`)
				.join(", ")}
		</>
	);
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
									<p>PLAYOFF AWARDS HERE</p>
								</div>
							) : (
								<p>???</p>
							)}
							<h2>Best Record</h2>
							{awards.bestRecordConfs.entries().map(([cid, t]) =>
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
					<p>TEAM AWARDS HERE</p>
				</div>
				<div className="col-xl-2 col-md-3 col-sm-4 col-6">
					<p>TEAM AWARDS HERE</p>
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

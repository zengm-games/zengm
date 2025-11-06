import useTitleBar from "../../hooks/useTitleBar.tsx";
import type { View } from "../../../common/types.ts";
import { helpers } from "../../util/index.ts";
import { PlayerNameLabels } from "../../components/index.tsx";
import { PHASE, PHASE_TEXT } from "../../../common/index.ts";
import Charts from "./Charts.tsx";
import PickText from "./PickText.tsx";
import type { PlayerOutcome } from "../../../worker/views/tradeSummary.ts";

const Outcome = ({ outcome }: { outcome: PlayerOutcome }) => {
	if (!outcome) {
		return null;
	}

	if (outcome.type === "freeAgent") {
		const actualSeason =
			outcome.phase > PHASE.PLAYOFFS ? outcome.season + 1 : outcome.season;
		return (
			<div>
				Signed as a free agent with{" "}
				<a
					href={helpers.leagueUrl([
						"roster",
						`${outcome.abbrev}_${outcome.tid}`,
						actualSeason,
					])}
				>
					{outcome.abbrev} in {outcome.season}
				</a>
			</div>
		);
	} else if (outcome.type === "godMode") {
		const actualSeason =
			outcome.phase > PHASE.PLAYOFFS ? outcome.season + 1 : outcome.season;
		return (
			<div>
				God Mode to{" "}
				<a
					href={helpers.leagueUrl([
						"roster",
						`${outcome.abbrev}_${outcome.tid}`,
						actualSeason,
					])}
				>
					{outcome.abbrev} in {outcome.season}
				</a>
			</div>
		);
	} else if (outcome.type === "retired") {
		return <div>Retired in {outcome.season}</div>;
	} else if (outcome.type === "sisyphus") {
		const actualSeason =
			outcome.phase > PHASE.PLAYOFFS ? outcome.season + 1 : outcome.season;
		return (
			<div>
				Sisyphus Mode to{" "}
				<a
					href={helpers.leagueUrl([
						"roster",
						`${outcome.abbrev}_${outcome.tid}`,
						actualSeason,
					])}
				>
					{outcome.abbrev} in {outcome.season}
				</a>
			</div>
		);
	} else if (outcome.type === "stillOnTeam") {
		return null;
	} else if (outcome.type === "trade") {
		if (outcome.eid === undefined) {
			return (
				<div>
					Traded to {outcome.abbrev} in {outcome.season}
				</div>
			);
		} else {
			return (
				<div>
					Traded to{" "}
					<a href={helpers.leagueUrl(["trade_summary", outcome.eid])}>
						{outcome.abbrev} in {outcome.season}
					</a>
				</div>
			);
		}
	} else if (outcome.type === "tradeBeforeDraft") {
		return "Traded before draft";
	}
};

const TradeSummary = ({
	challengeNoRatings,
	phase,
	season,
	seasonsToPlot,
	stat,
	teams,
	usePts,
}: View<"tradeSummary">) => {
	useTitleBar({
		title: "Trade Summary",
	});

	return (
		<>
			<p>
				Trade occurred during the{" "}
				<b>
					{season} {PHASE_TEXT[phase]}
				</b>
			</p>
			<div className="d-lg-flex">
				<div className="d-sm-flex mb-3 mb-lg-0 me-lg-5">
					{teams.map((t, i) => (
						<div
							key={t.tid}
							className={i === 0 ? "mb-sm-0 me-sm-5 mb-3" : undefined}
						>
							<h2>
								<a
									href={helpers.leagueUrl([
										"roster",
										`${t.abbrev}_${t.tid}`,
										season,
									])}
								>
									{t.region} {t.name}
								</a>{" "}
								received:
							</h2>
							{t.assets.length === 0 ? (
								<div className="mb-2">Nothing!</div>
							) : null}
							{t.assets.map((asset, i) => {
								if (asset.type === "player") {
									return (
										<div key={i} className="mb-2">
											<div>
												<PlayerNameLabels
													pid={asset.pid}
													pos={asset.pos}
													season={season}
													skills={asset.skills}
													defaultWatch={asset.watch}
													legacyName={asset.name}
												/>
											</div>
											<div>
												{helpers.formatCurrency(
													asset.contract.amount / 1000,
													"M",
												)}{" "}
												thru {asset.contract.exp}
												<br />
												{!challengeNoRatings || asset.retiredYear !== Infinity
													? `${asset.ovr} ovr, ${asset.pot} pot, `
													: null}
												{asset.age} years old
												<br />
												{helpers.roundStat(asset.stat, "ws")} {stat} after trade
												(
												{asset.stat === asset.statTeam
													? "all"
													: helpers.roundStat(asset.statTeam, "ws")}{" "}
												with {t.abbrev})
											</div>
											<Outcome outcome={asset.outcome} />
										</div>
									);
								}

								if (asset.type === "deletedPlayer") {
									return (
										<div key={i} className="mb-2">
											{asset.name}
											<br />
											{helpers.formatCurrency(
												asset.contract.amount / 1000,
												"M",
											)}{" "}
											thru {asset.contract.exp}
										</div>
									);
								}

								if (asset.type === "unrealizedPick") {
									return (
										<div key={i} className="mb-2">
											<PickText asset={asset} season={season} />
										</div>
									);
								}

								if (asset.type === "realizedPick") {
									return (
										<div key={i} className="mb-2">
											<div>
												<PlayerNameLabels
													pid={asset.pid}
													pos={asset.pos}
													skills={asset.skills}
													defaultWatch={asset.watch}
													legacyName={asset.name}
												/>
											</div>
											<div>
												<span className="text-body-secondary">
													via <PickText asset={asset} season={season} />
												</span>
												<br />
												{!challengeNoRatings || asset.retiredYear !== Infinity
													? `${asset.ovr} ovr, ${asset.pot} pot, `
													: null}
												{asset.age} years old
												<br />
												{helpers.roundStat(asset.stat, "ws")} {stat} after trade
												(
												{asset.stat === asset.statTeam
													? "all"
													: helpers.roundStat(asset.statTeam, "ws")}{" "}
												with {t.abbrev})
											</div>
											<Outcome outcome={asset.outcome} />
										</div>
									);
								}

								return "???";
							})}
							{t.assets.length === 0 ? null : (
								<b>
									{t.statSum === t.statSumTeam ? (
										<>
											{helpers.roundStat(t.statSum, "ws")} {stat} after trade
											(all with {t.abbrev})
										</>
									) : (
										<>
											{helpers.roundStat(t.statSum, "ws")} {stat} after trade
											(total)
											<br />
											{helpers.roundStat(t.statSumTeam, "ws")} {stat} after
											trade (with {t.abbrev})
										</>
									)}
								</b>
							)}
						</div>
					))}
				</div>
				<div className="flex-grow-1">
					<Charts
						phase={phase}
						season={season}
						seasonsToPlot={seasonsToPlot}
						stat={stat}
						teams={teams}
						usePts={usePts}
					/>
				</div>
			</div>
		</>
	);
};

export default TradeSummary;

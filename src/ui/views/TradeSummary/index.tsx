import useTitleBar from "../../hooks/useTitleBar";
import type { View } from "../../../common/types";
import { helpers } from "../../util";
import { PlayerNameLabels } from "../../components";
import { PHASE_TEXT } from "../../../common";
import Charts from "./Charts";
import PickText from "./PickText";

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
				<div className="d-sm-flex mb-3 mb-lg-0 mr-lg-5">
					{teams.map((t, i) => (
						<div
							key={t.tid}
							className={i === 0 ? "mb-sm-0 mr-sm-5 mb-3" : undefined}
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
													watch={asset.watch}
												>
													{asset.name}
												</PlayerNameLabels>
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
											</div>
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
													watch={asset.watch}
												>
													{asset.name}
												</PlayerNameLabels>
											</div>
											<div>
												<span className="text-muted">
													via <PickText asset={asset} season={season} />
												</span>
												<br />
												{!challengeNoRatings || asset.retiredYear !== Infinity
													? `${asset.ovr} ovr, ${asset.pot} pot, `
													: null}
												{asset.age} years old
												<br />
												{helpers.roundStat(asset.stat, "ws")} {stat} after trade
											</div>
										</div>
									);
								}

								return "???";
							})}
							<b>
								Total {stat} after trade: {helpers.roundStat(t.statSum, "ws")}
							</b>
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

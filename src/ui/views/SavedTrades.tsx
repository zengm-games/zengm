import { PHASE } from "../../common/index.ts";
import useTitleBar from "../hooks/useTitleBar.tsx";
import type { View } from "../../common/types.ts";
import { SummaryTeam } from "./Trade/Summary.tsx";
import { helpers, toWorker, useLocalPartial } from "../util/index.ts";
import {
	Offer,
	OfferTable,
	type OfferType,
	pickScore,
	playerScore,
} from "./TradingBlock/index.tsx";
import { Dropdown } from "react-bootstrap";
import useTradeOffersSwitch from "../hooks/useTradeOffersSwitch.tsx";

const SavedTrades = (props: View<"savedTrades">) => {
	const {
		challengeNoRatings,
		challengeNoTrades,
		gameOver,
		luxuryPayroll,
		luxuryTax,
		offers,
		phase,
		salaryCap,
		salaryCapType,
		spectator,
	} = props;

	useTitleBar({ title: "Saved Trades" });

	const { teamInfoCache } = useLocalPartial(["teamInfoCache"]);

	const tradeOffersSwitch = useTradeOffersSwitch();

	if (spectator) {
		return <p>You're not allowed to make trades in spectator mode.</p>;
	}

	if (challengeNoTrades) {
		return (
			<div>
				<p className="alert alert-danger d-inline-block">
					<b>Challenge Mode:</b> You're not allowed to make trades.
				</p>
			</div>
		);
	}

	if (
		(phase >= PHASE.AFTER_TRADE_DEADLINE && phase <= PHASE.PLAYOFFS) ||
		phase === PHASE.FANTASY_DRAFT ||
		gameOver
	) {
		return (
			<div>
				<h2>Error</h2>
				<p>
					You're not allowed to make trades{" "}
					{phase === PHASE.AFTER_TRADE_DEADLINE
						? "after the trade deadline"
						: "now"}
					.
				</p>
			</div>
		);
	}

	const handleNegotiate = async (offer: {
		dpids: number[];
		dpidsUser: number[];
		pids: number[];
		pidsUser: number[];
		tid: number;
	}) => {
		await toWorker("actions", "tradeFor", {
			otherDpids: offer.dpids,
			otherPids: offer.pids,
			tid: offer.tid,
			userDpids: offer.dpidsUser,
			userPids: offer.pidsUser,
		});
	};

	const getSearchSortValues = (
		players: OfferType["players"],
		picks: OfferType["picks"],
	) => {
		return {
			searchValue: `${players
				.map((p) => `${p.name} ${p.ratings.pos}`)
				.join(" ")} ${picks.map((pick) => pick.desc).join(" ")}`,
			sortValue: playerScore(players) + pickScore(picks),
		};
	};

	return (
		<>
			<p>
				Add trades to this list by clicking the "save trade" icon{" "}
				<span className="glyphicon glyphicon-flag" /> on any of the{" "}
				<a href={helpers.leagueUrl(["trade"])}>Trade</a>,{" "}
				<a href={helpers.leagueUrl(["trading_block"])}>Trading Block</a>, or{" "}
				<a href={helpers.leagueUrl(["trade_proposals"])}>Trade Proposals</a>{" "}
				pages.
			</p>
			<Dropdown>
				<Dropdown.Toggle variant="danger">Clear</Dropdown.Toggle>
				<Dropdown.Menu>
					<Dropdown.Item
						onClick={async () => {
							const hashes = offers.map((offer) => offer.hash);
							await toWorker("main", "clearSavedTrades", hashes);
						}}
					>
						All saved trades
					</Dropdown.Item>
					<Dropdown.Item
						onClick={async () => {
							const hashes = offers
								.filter(
									(offer) =>
										offer.missing.length > 0 || offer.missingUser.length > 0,
								)
								.map((offer) => offer.hash);
							await toWorker("main", "clearSavedTrades", hashes);
						}}
					>
						Trades with invalid assets
					</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown>
			{offers.length === 0 ? (
				<div className="mt-3">No saved trades</div>
			) : (
				tradeOffersSwitch.toggle
			)}
			{tradeOffersSwitch.value === "table" ? (
				<OfferTable
					assetCols={[
						{
							title: "You receive",
							sortSequence: ["desc", "asc"],
							sortType: "number",
						},
						{
							title: "You trade away",
							sortSequence: ["desc", "asc"],
							sortType: "number",
						},
					]}
					getAssetColContents={(offer) => {
						return [
							{
								value: (
									<SummaryTeam
										challengeNoRatings={challengeNoRatings}
										hideFinanceInfo
										hideTeamOvr
										luxuryPayroll={luxuryPayroll}
										luxuryTax={luxuryTax}
										missingAssets={offer.missing}
										salaryCap={salaryCap}
										salaryCapType={salaryCapType}
										showInlinePlayerInfo
										summary={offer.summary}
										t={offer.summary.teams[0]}
									/>
								),
								...getSearchSortValues(offer.players, offer.picks),
							},
							{
								value: (
									<SummaryTeam
										challengeNoRatings={challengeNoRatings}
										hideFinanceInfo
										hideTeamOvr
										luxuryPayroll={luxuryPayroll}
										luxuryTax={luxuryTax}
										missingAssets={offer.missingUser}
										salaryCap={salaryCap}
										salaryCapType={salaryCapType}
										showInlinePlayerInfo
										summary={offer.summary}
										t={offer.summary.teams[1]}
									/>
								),
								...getSearchSortValues(offer.playersUser, offer.picksUser),
							},
						];
					}}
					challengeNoRatings={challengeNoRatings}
					handleNegotiate={handleNegotiate}
					offers={offers}
					salaryCap={salaryCap}
					salaryCapType={salaryCapType}
				/>
			) : (
				<>
					{offers.map((offer, i) => {
						return (
							<Offer
								key={offer.hash}
								challengeNoRatings={challengeNoRatings}
								onNegotiate={() => {
									handleNegotiate(offer);
								}}
								salaryCap={salaryCap}
								salaryCapType={salaryCapType}
								teamInfo={teamInfoCache[offer.tid]!}
								hideTopTeamOvrs
								first={i === 0}
								{...offer}
							>
								<div className="d-flex gap-5">
									{offer.summary.teams.map((t, j) => {
										const missingKey = j === 0 ? "missing" : "missingUser";
										return (
											<div key={j}>
												<SummaryTeam
													challengeNoRatings={challengeNoRatings}
													hideFinanceInfo
													luxuryPayroll={luxuryPayroll}
													luxuryTax={luxuryTax}
													missingAssets={offer[missingKey]}
													salaryCap={salaryCap}
													salaryCapType={salaryCapType}
													showInlinePlayerInfo
													summary={offer.summary}
													t={t}
												/>
											</div>
										);
									})}
								</div>
							</Offer>
						);
					})}
				</>
			)}
		</>
	);
};

export default SavedTrades;

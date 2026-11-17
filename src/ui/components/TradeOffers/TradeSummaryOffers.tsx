import { toWorker } from "../../util/toWorker.ts";
import { useLocal } from "../../util/local.ts";
import { SummaryTeam } from "../../views/Trade/Summary.tsx";
import { Offer, type OfferType } from "./Offer.tsx";
import { OfferTable } from "./OfferTable.tsx";
import { pickScore, playerScore } from "./scores.ts";

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
			.map((p) => `${p.firstName} ${p.lastName} ${p.ratings.pos}`)
			.join(" ")} ${picks.map((pick) => pick.desc).join(" ")}`,
		sortValue: playerScore(players) + pickScore(picks),
	};
};

// Offers where both sides of the trade are shown as a trade summary, like on the Saved Trades and Trade Proposals pages
export const TradeSummaryOffers = ({
	layout,
	offers,
	onRemove,
}: {
	layout: "table" | "list";

	// hash is for saved trades, where there can be multiple trades with the same team
	offers: (OfferType & { hash?: string })[];

	onRemove?: (tid: number) => void;
}) => {
	const { challengeNoRatings, salaryCap, salaryCapType, teamInfoCache } =
		useLocal([
			"challengeNoRatings",
			"salaryCap",
			"salaryCapType",
			"teamInfoCache",
		]);

	if (layout === "table") {
		return (
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
									hideFinanceInfo
									hideTeamOvr
									missingAssets={offer.missing}
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
									hideFinanceInfo
									hideTeamOvr
									missingAssets={offer.missingUser}
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
				handleRemove={onRemove}
				offers={offers}
				salaryCap={salaryCap}
				salaryCapType={salaryCapType}
			/>
		);
	}

	return offers.map((offer, i) => {
		return (
			<Offer
				key={offer.hash ?? offer.tid}
				challengeNoRatings={challengeNoRatings}
				onNegotiate={() => {
					handleNegotiate(offer);
				}}
				onRemove={
					onRemove
						? () => {
								onRemove(offer.tid);
							}
						: undefined
				}
				salaryCap={salaryCap}
				salaryCapType={salaryCapType}
				teamInfo={teamInfoCache[offer.tid]!}
				hideTopTeamOvrs
				first={i === 0}
				{...offer}
			>
				<div className="d-flex gap-5">
					{offer.summary.teams.map((t, j) => {
						return (
							<div key={j}>
								<SummaryTeam
									hideFinanceInfo
									missingAssets={j === 0 ? offer.missing : offer.missingUser}
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
	});
};

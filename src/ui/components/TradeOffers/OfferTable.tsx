import clsx from "clsx";
import { helpers } from "../../util/helpers.ts";
import { useLocal } from "../../util/local.ts";
import { getCols } from "../../../common/getCols.ts";
import type { LocalStateUI } from "../../../common/types.ts";
import { DataTable, type Col } from "../DataTable/index.tsx";
import { HelpPopover } from "../HelpPopover.tsx";
import { SaveTrade } from "../SaveTrade.tsx";
import { wrappedCurrency } from "../wrappedCurrency.ts";
import { OvrChange } from "../../views/Trade/Summary.tsx";
import type { OfferType } from "./Offer.tsx";

export const OfferTable = ({
	assetCols,
	challengeNoRatings,
	getAssetColContents,
	handleNegotiate,
	handleRemove,
	offers,
	salaryCap,
	salaryCapType,
}: {
	assetCols: Col[];
	challengeNoRatings: boolean;
	getAssetColContents: (offer: OfferType) => any[];
	handleNegotiate: (tradeInfo: {
		tid: number;
		pids: number[];
		pidsUser: number[];
		dpids: number[];
		dpidsUser: number[];
	}) => void;
	handleRemove?: (tid: number) => void;
	offers: OfferType[];
} & Pick<LocalStateUI, "salaryCap" | "salaryCapType">) => {
	const { teamInfoCache, userTid } = useLocal(["teamInfoCache", "userTid"]);

	const offerCols = getCols(
		[
			"",
			"Team",
			"Record",
			"Strategy",
			"Ovr",
			"Ovr",
			salaryCapType === "none" ? "Payroll" : "Cap Space",
			"Cap",
			"Actions",
		],
		{
			"": {
				width: "1px",
			},
			Actions: {
				sortSequence: [],
				width: "1px",
			},
		},
	);
	offerCols[4]!.title = "Your Ovr";
	offerCols[4]!.desc = "Your team's change in ovr rating";
	offerCols[5]!.title = "Other Ovr";
	offerCols[5]!.desc = "Other team's change in ovr rating";
	offerCols.splice(6, 0, ...assetCols);

	const offerRows = offers.map((offer, i) => {
		const salaryCapOrPayroll =
			salaryCapType === "none" ? offer.payroll : salaryCap - offer.payroll;

		const t = teamInfoCache[offer.tid];
		if (!t) {
			return {
				key: i,
				data: [],
			};
		}

		return {
			key: i,
			data: [
				<SaveTrade
					tradeTeams={[
						{
							pids: offer.pidsUser,
							dpids: offer.dpidsUser,
							tid: userTid,
						},
						{
							pids: offer.pids,
							dpids: offer.dpids,
							tid: offer.tid,
						},
					]}
				/>,
				<a href={helpers.leagueUrl(["roster", `${t.abbrev}_${offer.tid}`])}>
					{t.abbrev}
				</a>,
				helpers.formatRecord(offer),
				offer.strategy,
				!challengeNoRatings
					? {
							value: (
								<OvrChange
									before={offer.summary.teams[1].ovrBefore}
									after={offer.summary.teams[1].ovrAfter}
								/>
							),
							sortValue: offer.summary.teams[1].ovrAfter,
							searchValue: `${offer.summary.teams[1].ovrBefore} ${offer.summary.teams[1].ovrAfter}`,
						}
					: null,
				!challengeNoRatings
					? {
							value: (
								<OvrChange
									before={offer.summary.teams[0].ovrBefore}
									after={offer.summary.teams[0].ovrAfter}
								/>
							),
							sortValue: offer.summary.teams[0].ovrAfter,
							searchValue: `${offer.summary.teams[0].ovrBefore} ${offer.summary.teams[0].ovrAfter}`,
						}
					: null,
				...getAssetColContents(offer),
				wrappedCurrency(salaryCapOrPayroll / 1000, "M"),
				{
					value: offer.summary.warning ? (
						<HelpPopover className="fs-4">{offer.summary.warning}</HelpPopover>
					) : null,
					sortValue: offer.summary.warningAmount ?? 0,
					classNames: clsx(
						"text-center",
						offer.summary.warning ? "table-danger" : undefined,
					),
				},
				<div className="d-flex align-items-center">
					<button
						type="submit"
						className="btn btn-light-bordered"
						onClick={() => {
							handleNegotiate({
								tid: offer.tid,
								pids: offer.pids,
								pidsUser: offer.pidsUser,
								dpids: offer.dpids,
								dpidsUser: offer.dpidsUser,
							});
						}}
					>
						Negotiate
					</button>
					{handleRemove ? (
						<button
							type="button"
							className="btn-close ms-2 p-0"
							title="Remove trade from list"
							onClick={() => {
								handleRemove(offer.tid);
							}}
						/>
					) : null}
				</div>,
			],
		};
	});

	if (offerRows.length === 0) {
		return null;
	}

	return (
		<DataTable
			className="align-top-all"
			clickable={false}
			cols={offerCols}
			defaultSort={[1, "asc"]}
			name={`TradingBlock:Offers`}
			rows={offerRows}
			small={false}
		/>
	);
};

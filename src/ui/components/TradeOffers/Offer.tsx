import type { ReactNode } from "react";
import { helpers } from "../../util/helpers.ts";
import { useLocal } from "../../util/local.ts";
import type { LocalStateUI } from "../../../common/types.ts";
import type api from "../../../worker/api/index.ts";
import type { MissingAsset } from "../../../worker/views/savedTrades.ts";
import { OvrChange } from "../../views/Trade/Summary.tsx";
import { SaveTrade } from "../SaveTrade.tsx";

export type OfferType = Awaited<
	ReturnType<(typeof api)["main"]["getTradingBlockOffers"]>
>[0] & {
	missing?: MissingAsset[];
	missingUser?: MissingAsset[];
	willing?: boolean;
};

type OfferProps = {
	children: ReactNode;
	challengeNoRatings: boolean;
	first: boolean;
	hideTopTeamOvrs?: boolean;
	onNegotiate: () => void;
	onRemove?: () => void;
	teamInfo: {
		abbrev: string;
		name: string;
		region: string;
	};
} & OfferType &
	Pick<LocalStateUI, "salaryCap" | "salaryCapType">;

export const Offer = (props: OfferProps) => {
	const {
		challengeNoRatings,
		children,
		dpids,
		dpidsUser,
		first,
		hideTopTeamOvrs,
		onNegotiate,
		onRemove,
		payroll,
		pids,
		pidsUser,
		salaryCap,
		salaryCapType,
		strategy,
		summary,
		tid,
		teamInfo,
	} = props;

	const salaryCapOrPayroll =
		salaryCapType === "none" ? payroll : salaryCap - payroll;
	const salaryCapOrPayrollText =
		salaryCapType === "none" ? "payroll" : "cap space";

	const { userTid } = useLocal(["userTid"]);

	if (!teamInfo) {
		return null;
	}

	return (
		<div className={first ? undefined : "mt-4"} style={{ maxWidth: 1125 }}>
			<div className="d-flex align-items-center mb-2">
				<h2 className="mb-0">
					<a href={helpers.leagueUrl(["roster", `${teamInfo.abbrev}_${tid}`])}>
						{teamInfo.region} {teamInfo.name}
					</a>
				</h2>
				<SaveTrade
					className="ms-4"
					tradeTeams={[
						{
							pids: pidsUser,
							dpids: dpidsUser,
							tid: userTid,
						},
						{
							pids,
							dpids,
							tid,
						},
					]}
				/>
				{onRemove ? (
					<button
						type="button"
						className="btn-close ms-4"
						title="Remove trade from list"
						onClick={onRemove}
					/>
				) : null}
			</div>
			<div
				className="mb-3 d-sm-flex justify-content-between"
				style={{ maxWidth: 500 }}
			>
				<div>
					{helpers.formatRecord(props)}, {strategy},{" "}
					{helpers.formatCurrency(salaryCapOrPayroll / 1000, "M")}{" "}
					{salaryCapOrPayrollText}
				</div>
				{!challengeNoRatings && !hideTopTeamOvrs ? (
					<>
						<div>
							Your ovr:{" "}
							<OvrChange
								before={summary.teams[1].ovrBefore}
								after={summary.teams[1].ovrAfter}
							/>
						</div>
						<div>
							{teamInfo.abbrev} ovr:{" "}
							<OvrChange
								before={summary.teams[0].ovrBefore}
								after={summary.teams[0].ovrAfter}
							/>
						</div>
					</>
				) : null}
			</div>
			{children}
			{summary.warning ? (
				<p className="text-danger">{summary.warning}</p>
			) : null}

			<button
				type="submit"
				className="btn btn-light-bordered mb-4"
				onClick={onNegotiate}
			>
				Negotiate
			</button>
		</div>
	);
};

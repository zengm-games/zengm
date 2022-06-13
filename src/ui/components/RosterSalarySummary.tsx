import { HelpPopover } from ".";
import type { GameAttributesLeague } from "../../common/types";
import { helpers } from "../util";

const RosterSalarySummary = ({
	capSpace,
	luxuryPayroll,
	maxContract,
	minContract,
	numRosterSpots,
	payroll,
	salaryCapType,
}: {
	capSpace: number;
	luxuryPayroll: number;
	maxContract: number;
	minContract: number;
	numRosterSpots: number;
	payroll: number;
	salaryCapType: GameAttributesLeague["salaryCapType"];
}) => {
	const actualCapSpace = capSpace > 0 ? capSpace : 0;

	return (
		<div className="mb-3">
			You currently have <b>{numRosterSpots}</b> open roster spots
			{salaryCapType === "none" ? (
				<>
					{" "}
					and a <b>{helpers.formatCurrency(payroll, "M")}</b> payroll (luxury
					tax limit: {helpers.formatCurrency(luxuryPayroll, "M")}).
				</>
			) : (
				<>
					{" "}
					and{" "}
					<b className={actualCapSpace > 0 ? "text-success" : undefined}>
						{helpers.formatCurrency(actualCapSpace, "M")}
					</b>{" "}
					in cap space
					{capSpace < 0 ? (
						<>
							{" "}
							(
							<b className="text-danger">
								{helpers.formatCurrency(Math.abs(capSpace), "M")}
							</b>{" "}
							over the cap)
						</>
					) : null}
					.{" "}
					<HelpPopover title="Cap Space">
						<p>
							"Cap space" is the difference between your current payroll and the
							salary cap.
						</p>
						<p>
							{salaryCapType === "hard"
								? "You "
								: "After the season you can go over the salary cap to re-sign your own players. Besides that, you "}
							can only exceed the salary cap to sign players to minimum
							contracts ({helpers.formatCurrency(minContract / 1000, "M")}
							/year).
						</p>
					</HelpPopover>
				</>
			)}
			<br />
			Min contract: {helpers.formatCurrency(minContract / 1000, "M")}
			<br />
			Max contract: {helpers.formatCurrency(maxContract / 1000, "M")}
			<br />
		</div>
	);
};

export default RosterSalarySummary;

import PropTypes from "prop-types";
import React from "react";
import { HelpPopover } from ".";
import { helpers } from "../util";

const RosterSalarySummary = ({
	capSpace,
	hardCap,
	maxContract,
	minContract,
	numRosterSpots,
}: {
	capSpace: number;
	hardCap: boolean;
	maxContract: number;
	minContract: number;
	numRosterSpots: number;
}) => {
	return (
		<div className="mb-3">
			You currently have <b>{numRosterSpots}</b> open roster spots and{" "}
			<b>{helpers.formatCurrency(capSpace, "M")}</b> in cap space.{" "}
			<HelpPopover title="Cap Space">
				<p>
					"Cap space" is the difference between your current payroll and the
					salary cap.
				</p>
				<p>
					{hardCap
						? "You "
						: "After the season you can go over the salary cap to re-sign your own players. Besides that, you "}
					can only exceed the salary cap to sign players to minimum contracts (
					{helpers.formatCurrency(minContract / 1000, "M")}/year).
				</p>
			</HelpPopover>
			<br />
			Min contract: {helpers.formatCurrency(minContract / 1000, "M")}
			<br />
			Max contract: {helpers.formatCurrency(maxContract / 1000, "M")}
			<br />
		</div>
	);
};

RosterSalarySummary.propTypes = {
	capSpace: PropTypes.number.isRequired,
	hardCap: PropTypes.bool.isRequired,
	maxContract: PropTypes.number.isRequired,
	minContract: PropTypes.number.isRequired,
	numRosterSpots: PropTypes.number.isRequired,
};

export default RosterSalarySummary;

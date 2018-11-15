// @flow

import PropTypes from "prop-types";
import React from "react";
import { HelpPopover } from ".";
import { helpers } from "../util";

const RosterSalarySummary = ({
    capSpace,
    hardCap,
    minContract,
    numRosterSpots,
}: {
    capSpace: number,
    hardCap: boolean,
    minContract: number,
    numRosterSpots: number,
}) => {
    return (
        <p>
            You currently have <b>{numRosterSpots}</b> open roster spots and{" "}
            <b>{helpers.formatCurrency(capSpace, "M")}</b> in cap space.{" "}
            <HelpPopover placement="bottom" title="Cap Space">
                <p>
                    "Cap space" is the difference between your current payroll
                    and the salary cap.
                </p>
                <p>
                    {hardCap
                        ? "You "
                        : "After the season you can go over the salary cap to re-sign your own players. Besides that, you "}
                    can only exceed the salary cap to sign players to minimum
                    contracts ($
                    {minContract}
                    k/year).
                </p>
            </HelpPopover>
        </p>
    );
};

RosterSalarySummary.propTypes = {
    capSpace: PropTypes.number.isRequired,
    hardCap: PropTypes.bool.isRequired,
    minContract: PropTypes.number.isRequired,
    numRosterSpots: PropTypes.number.isRequired,
};

export default RosterSalarySummary;

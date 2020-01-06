// @flow

import PropTypes from "prop-types";
import React from "react";
import DropdownItem from "reactstrap/lib/DropdownItem";
import DropdownMenu from "reactstrap/lib/DropdownMenu";
import DropdownToggle from "reactstrap/lib/DropdownToggle";
import UncontrolledDropdown from "reactstrap/lib/UncontrolledDropdown";
import { helpers } from "../util";

const MoreInfo = ({ abbrev, season }: { abbrev: string, season: number }) => {
	return (
		<UncontrolledDropdown className="ml-auto">
			<DropdownToggle caret tag="a">
				More Info
			</DropdownToggle>
			<DropdownMenu right>
				<DropdownItem
					href={helpers.leagueUrl(["player_stats", abbrev, season])}
				>
					Player Stats
				</DropdownItem>
				<DropdownItem
					href={helpers.leagueUrl(["player_ratings", abbrev, season])}
				>
					Player Ratings
				</DropdownItem>
			</DropdownMenu>
		</UncontrolledDropdown>
	);
};

MoreInfo.propTypes = {
	abbrev: PropTypes.string,
	season: PropTypes.number,
};

export default MoreInfo;

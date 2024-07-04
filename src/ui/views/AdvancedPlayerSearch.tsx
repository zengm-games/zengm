import { useState } from "react";
import type { View } from "../../common/types";
import useDropdownOptions from "../hooks/useDropdownOptions";
import useTitleBar from "../hooks/useTitleBar";
import { OptionDropdown } from "./PlayerGraphs";
import { isSport } from "../../common";
import { helpers, realtimeUpdate } from "../util";

const AdvancedPlayerSearch = (props: View<"advancedPlayerSearch">) => {
	const [[seasonStart, seasonEnd], setSeasonRange] = useState<[number, number]>(
		[props.seasonStart, props.seasonEnd],
	);
	const [singleSeason, setSingleSeason] = useState(props.singleSeason);
	const [playoffs, setPlayoffs] = useState(props.playoffs);
	const [statType, setStatType] = useState(props.statType);

	useTitleBar({
		title: "Advanced Player Search",
	});

	const seasons = useDropdownOptions("seasons");
	const playoffsOptions = useDropdownOptions("playoffsCombined");
	const statTypes = useDropdownOptions("statTypesStrict");

	return (
		<>
			<form
				onSubmit={event => {
					event.preventDefault();
					realtimeUpdate(
						[],
						helpers.leagueUrl([
							"advanced_player_search",
							seasonStart,
							seasonEnd,
							singleSeason,
							playoffs,
							statType,
							"FILTERS",
						]),
					);
				}}
			>
				<div className="mb-3">
					<label htmlFor="seasonStart" className="form-label">
						Season range
					</label>
					<div className="input-group">
						<select
							id="seasonStart"
							className="form-select"
							value={seasonStart}
							onChange={event => {
								const season = parseInt(event.target.value);
								if (season > seasonEnd) {
									setSeasonRange([season, season]);
								} else {
									setSeasonRange([season, seasonEnd]);
								}
							}}
							style={{
								maxWidth: 70,
							}}
						>
							{seasons.map(x => {
								return <OptionDropdown key={x.key} value={x} />;
							})}
						</select>
						<span className="input-group-text">to</span>
						<select
							className="form-select"
							value={seasonEnd}
							onChange={event => {
								const season = parseInt(event.target.value);
								if (season < seasonStart) {
									setSeasonRange([season, season]);
								} else {
									setSeasonRange([seasonStart, season]);
								}
							}}
							style={{
								maxWidth: 70,
							}}
						>
							{seasons.map(x => {
								return <OptionDropdown key={x.key} value={x} />;
							})}
						</select>
					</div>
				</div>
				<div className="mb-3">
					<select
						className="form-select"
						value={singleSeason}
						onChange={event => {
							setSingleSeason(event.target.value as any);
						}}
					>
						<option value="singleSeason">Single season</option>
						<option value="totals">Totals</option>
					</select>
				</div>
				<div className="mb-3">
					<select
						className="form-select"
						onChange={event => {
							const newPlayoffs = event.target.value as any;

							setPlayoffs(newPlayoffs);
						}}
						value={playoffs}
					>
						{playoffsOptions.map(x => {
							return <OptionDropdown key={x.key} value={x} />;
						})}
					</select>
				</div>
				{isSport("basketball") ? (
					<div className="mb-3">
						<select
							className="form-select"
							value={statType}
							onChange={event => {
								setStatType(event.target.value as any);
							}}
						>
							{statTypes.map(x => {
								return <OptionDropdown key={x.key} value={x} />;
							})}
						</select>
					</div>
				) : null}
				<button type="submit" className="btn btn-primary">
					Search
				</button>
			</form>
		</>
	);
};

export default AdvancedPlayerSearch;

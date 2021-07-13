const leaguePartDescriptions: { [key: string]: string } = {
	gameAttributes: "League settings",
	startingSeason: "Starting season",
	players: "Players, including ratings and stats",
	teams: "Teams",
	teamSeason: "Team seasons history",
	teamStats: "Team stats history",
	allStars: "All-Star Game history",
	awards: "Awards history",
	games: "Box scores",
	releasedPlayers: "Contracts owed to released players",
	draftLotteryResults: "Draft lottery history",
	events: "News feed",
	negotiations: "In-progress contract negotiations",
	trade: "In-progress trade negotiations",
	messages: "Messages from the owner",
	playerFeats: "Statistical feats",
	playoffSeries: "Upcoming and historical playoff series",
	schedule: "Upcoming schedule",
	draftPicks: "Traded future draft picks",
	scheduledEvents:
		"Scheduled events, like expansion and league rule changes. For more control, go to Tools > Scheduled Events after creating your league.",
	headToHeads: "Team head-to-head results",
};

const LeaguePartPicker = ({
	allKeys,
	keptKeys,
	setKeptKeys,
}: {
	allKeys: string[];
	keptKeys: string[];
	setKeptKeys: (keys: string[]) => void;
}) => {
	if (allKeys.length === 0) {
		return null;
	}

	const keysSorted = Object.keys(leaguePartDescriptions).filter(key =>
		allKeys.includes(key),
	);
	keysSorted.push(...allKeys.filter(key => !keysSorted.includes(key)));

	return (
		<div className="form-group">
			<label>Use from selected league:</label>

			{keysSorted.map(key => (
				<div key={key} className="form-check">
					<label className="form-check-label">
						<input
							className="form-check-input"
							onChange={() => {
								if (keptKeys.includes(key)) {
									setKeptKeys(keptKeys.filter(key2 => key2 !== key));
								} else {
									setKeptKeys([...keptKeys, key]);
								}
							}}
							type="checkbox"
							checked={keptKeys.includes(key)}
						/>
						{leaguePartDescriptions[key] ? leaguePartDescriptions[key] : key}
					</label>
				</div>
			))}

			<div className="mt-1">
				<button
					className="btn btn-link p-0"
					onClick={event => {
						event.preventDefault();
						setKeptKeys([...allKeys]);
					}}
				>
					All
				</button>{" "}
				|{" "}
				<button
					className="btn btn-link p-0"
					onClick={event => {
						event.preventDefault();
						setKeptKeys([]);
					}}
				>
					None
				</button>
			</div>

			<p className="alert alert-warning my-3">
				Warning: selecting a weird combination of things may result in a
				partially or completely broken league.
			</p>
		</div>
	);
};

export default LeaguePartPicker;

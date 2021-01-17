import PropTypes from "prop-types";
import { MoreLinks, SafeHtml } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";
import type { View } from "../../common/types";

const Transactions = ({
	abbrev,
	eventType,
	events,
	season,
	tid,
}: View<"transactions">) => {
	useTitleBar({
		title: "Transactions",
		dropdownView: "transactions",
		dropdownFields: {
			teamsAndAll: abbrev,
			seasonsAndAll: season,
			eventType,
		},
	});

	const moreLinks =
		abbrev !== "all" ? (
			<MoreLinks
				type="team"
				page="depth"
				abbrev={abbrev}
				tid={tid}
				season={season !== "all" ? season : undefined}
			/>
		) : (
			<p>
				More: <a href={helpers.leagueUrl(["news", "all", season])}>News Feed</a>
			</p>
		);

	return (
		<>
			{moreLinks}

			<ul className="list-group">
				{events.map(e => (
					<li key={e.eid} className="list-group-item">
						<SafeHtml dirty={e.text} />
					</li>
				))}
			</ul>
		</>
	);
};

Transactions.propTypes = {
	abbrev: PropTypes.string.isRequired,
	eventType: PropTypes.oneOf([
		"all",
		"draft",
		"freeAgent",
		"reSigned",
		"release",
		"trade",
	]).isRequired,
	events: PropTypes.arrayOf(
		PropTypes.shape({
			eid: PropTypes.number.isRequired,
			text: PropTypes.string.isRequired,
		}),
	).isRequired,
	season: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
	tid: PropTypes.number.isRequired,
};

export default Transactions;

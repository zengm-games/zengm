import { MoreLinks, SafeHtml } from "../components/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers } from "../util/index.ts";
import type { View } from "../../common/types.ts";

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
				{events.map((e) => (
					<li key={e.eid} className="list-group-item">
						<SafeHtml dirty={e.text} />
					</li>
				))}
			</ul>
		</>
	);
};

export default Transactions;

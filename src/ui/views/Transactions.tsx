import { MoreLinks } from "../components/MoreLinks.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers } from "../util/helpers.ts";
import type { View } from "../../common/types.ts";
import { SafeHtml } from "../components/SafeHtml.tsx";

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
			teamsAndAllWatch: abbrev,
			seasonsAndAll: season,
			eventType,
		},
	});

	const moreLinks =
		tid !== undefined ? (
			<MoreLinks
				type="team"
				page="transactions"
				abbrev={abbrev}
				tid={tid}
				season={season !== "all" ? season : undefined}
			/>
		) : (
			<p>
				More:{" "}
				<a href={helpers.leagueUrl(["news", abbrev, season])}>News Feed</a>
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

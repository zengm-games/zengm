import { MoreLinks } from "../components/MoreLinks.tsx";
import { dropdownOptions } from "../hooks/useDropdownOptions.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers } from "../util/helpers.ts";
import type { View } from "../../common/types.ts";
import { SafeHtml } from "../components/SafeHtml.tsx";

const Transactions = ({
	eventType,
	events,
	season,
	team,
}: View<"transactions">) => {
	useTitleBar({
		title: "Transactions",
		dropdown: {
			fields: [
				{
					key: "team",
					options: { type: "teams", all: true, watch: true },
					value: team,
				},
				{
					key: "season",
					options: { type: "seasons", all: true },
					value: season,
				},
				{
					key: "eventType",
					options: dropdownOptions.eventType,
					value: eventType,
				},
			],
			view: "transactions",
		},
	});

	const moreLinks =
		typeof team === "number" ? (
			<MoreLinks
				type="team"
				page="transactions"
				tid={team}
				season={season !== "all" ? season : undefined}
			/>
		) : (
			<p>
				More: <a href={helpers.leagueUrl(["news", team, season])}>News Feed</a>
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

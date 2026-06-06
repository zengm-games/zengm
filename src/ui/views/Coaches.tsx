import useTitleBar from "../hooks/useTitleBar.tsx";
import { DataTable } from "../components/DataTable/index.tsx";
import type { Col, DataTableRow } from "../components/DataTable/index.tsx";
import { helpers } from "../util/helpers.ts";
import { toWorker } from "../util/toWorker.ts";
import type { View } from "../../common/types.ts";

const dialLabel = (value: number) => {
	if (value === 0) {
		return "0";
	}
	return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
};

const num = (title: string, desc?: string): Col => ({
	title,
	desc,
	sortSequence: ["desc", "asc"],
	sortType: "number",
});

const Coaches = ({
	coaches,
	freeAgent,
	spectator,
	userTid,
}: View<"coaches">) => {
	useTitleBar({ title: "Coaches" });

	const canEdit = !spectator;
	const userHasCoach = coaches.some((c) => c.tid === userTid);

	const cols: Col[] = [
		{ title: "Coach" },
		{ title: "Team" },
		num("Age"),
		num("Ovr", "Overall"),
		num("Dev", "Development"),
		num("Tac", "Tactics"),
		num("Adp", "Adaptability"),
		num("Mot", "Motivation"),
		num("Salary"),
		num("Until", "Contract expiration"),
		num("W", "Wins this season"),
		num(
			"Exp W",
			"Expected wins this season (talent-based, injury & trade aware)",
		),
		num("Δ", "Wins above expectation this season"),
		num("COY", "Coach of the Year awards"),
		{ title: "Philosophy", desc: "3s / pace / glass / paint D / aggression" },
		{ title: "", noSearch: true, sortSequence: [] },
	];

	const rows: DataTableRow[] = coaches.map((c) => {
		const isUserCoach = c.tid === userTid;
		const isFreeAgent = c.tid === freeAgent;
		const coyCount = c.awards.filter(
			(a) => a.type === "Coach of the Year",
		).length;
		const delta =
			c.won !== undefined && c.expectedWins !== undefined
				? c.won - c.expectedWins
				: undefined;

		return {
			key: c.cid,
			data: [
				{
					value: (
						<>
							<a href={helpers.leagueUrl(["coach", String(c.cid)])}>
								{c.firstName} {c.lastName}
							</a>
							{c.fromPid !== undefined ? (
								<span className="text-body-secondary"> (ex-player)</span>
							) : null}
						</>
					),
					sortValue: `${c.lastName} ${c.firstName}`,
					searchValue: `${c.firstName} ${c.lastName}`,
				},
				{
					value: c.abbrev ? (
						<a href={helpers.leagueUrl(["roster", `${c.abbrev}_${c.tid}`])}>
							{c.abbrev}
						</a>
					) : (
						<span className="text-body-secondary">FA</span>
					),
					// Free agents sort to the end.
					sortValue: c.abbrev ?? "ZZZ",
				},
				c.age,
				c.ratings.ovr,
				c.ratings.development,
				c.ratings.tactics,
				c.ratings.adaptability,
				c.ratings.motivation,
				{
					value: helpers.formatCurrency(c.contract.amount / 1000, "M"),
					sortValue: c.contract.amount,
				},
				c.contract.exp,
				{ value: c.won ?? "", sortValue: c.won ?? -1 },
				{
					value: c.expectedWins !== undefined ? c.expectedWins.toFixed(1) : "",
					sortValue: c.expectedWins ?? -1,
				},
				{
					value:
						delta !== undefined
							? `${delta > 0 ? "+" : ""}${delta.toFixed(1)}`
							: "",
					sortValue: delta ?? -999,
					classNames:
						delta !== undefined
							? delta > 0
								? "text-success"
								: delta < 0
									? "text-danger"
									: undefined
							: undefined,
				},
				{ value: coyCount > 0 ? coyCount : "", sortValue: coyCount },
				{
					value: (
						<span className="text-body-secondary">
							{dialLabel(c.philosophy.threePointTendency)} /{" "}
							{dialLabel(c.philosophy.pace)} /{" "}
							{dialLabel(c.philosophy.crashOffensiveGlass)} /{" "}
							{dialLabel(c.philosophy.paintDefense)} /{" "}
							{dialLabel(c.philosophy.defensiveAggression)}
						</span>
					),
					sortValue: c.philosophy.threePointTendency,
				},
				{
					value: (
						<>
							{canEdit && isFreeAgent ? (
								<button
									className="btn btn-xs btn-primary"
									onClick={async () => {
										await toWorker("main", "hireCoach", {
											cid: c.cid,
											tid: userTid,
										});
									}}
								>
									Hire
								</button>
							) : null}
							{canEdit && isUserCoach ? (
								<button
									className="btn btn-xs btn-danger"
									onClick={async () => {
										await toWorker("main", "fireCoach", { tid: userTid });
									}}
								>
									Fire
								</button>
							) : null}
						</>
					),
					noSearch: true,
				},
			],
			classNames: isUserCoach ? "table-info" : undefined,
		};
	});

	return (
		<>
			<p>
				Every team has a head coach who sets its playing style and develops its
				players. <b>Dev</b> drives player progression, <b>Tac</b> in-game
				adjustments, <b>Adp</b> how much they tailor their style to the roster,
				and <b>Mot</b> morale. <b>Δ</b> is wins above expectation this season.
				Hire from the free-agent pool below.
			</p>

			{canEdit && !userHasCoach ? (
				<p className="text-warning">
					Your team has no head coach! Hire one below, or one will be assigned
					at the start of next season.
				</p>
			) : null}

			<DataTable
				cols={cols}
				defaultSort={[3, "desc"]}
				name="Coaches"
				pagination
				rows={rows}
			/>
		</>
	);
};

export default Coaches;

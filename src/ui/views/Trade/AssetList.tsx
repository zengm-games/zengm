import range from "lodash-es/range";
import { DataTable, PlayerNameLabels } from "../../components";
import { getCols, helpers } from "../../util";
import type { Player, View } from "../../../common/types";
import { Dropdown } from "react-bootstrap";
import { TableConfig } from "../../util/TableConfig";
import type { MetaCol } from "../../util/columns/getCols";
import getTemplate from "../../util/columns/getTemplate";

type HandleToggle = (
	userOrOther: "other" | "user",
	playerOrPick: "pick" | "player",
	includeOrExclude: "include" | "exclude",
	id: number,
) => Promise<void>;

type HandleBulk = (
	type: "check" | "clear",
	userOrOther: "other" | "user",
	playerOrPick: "pick" | "player",
	draftRoundOnly?: number,
) => Promise<void>;

type UserOrOther = "user" | "other";

type TradeProps = View<"trade">;
type Picks = TradeProps["userRoster"];
type Roster = TradeProps["otherRoster"];

const genPlayerRows = (
	players: Roster,
	playerCols: MetaCol[],
	config: TableConfig,
) => {
	return players.map(p => {
		return {
			key: p.pid,
			data: Object.fromEntries(
				playerCols.map(col => [col.key, getTemplate(p, col, config)]),
			),
			classNames: {
				"table-danger": (p.excluded || p.untradable) && !p.included,
				"table-success": p.included,
			},
		};
	});
};

const genPickRows = (
	picks: Picks,
	handleToggle: HandleToggle,
	userOrOther: UserOrOther,
) => {
	return picks.map(pick => {
		return {
			key: pick.dpid,
			data: [
				<input
					name="other-dpids"
					type="checkbox"
					checked={pick.included}
					onChange={() => {
						handleToggle(userOrOther, "pick", "include", pick.dpid);
					}}
				/>,
				<input
					type="checkbox"
					title="Exclude this pick from counter offers"
					checked={pick.excluded}
					onChange={() => {
						handleToggle(userOrOther, "pick", "exclude", pick.dpid);
					}}
				/>,
				pick.desc,
			],
			classNames: {
				"table-danger": pick.excluded && !pick.included,
				"table-success": pick.included,
			},
		};
	});
};

const pickCols = getCols(["", "X", "Draft Picks"], {
	"": {
		sortSequence: [],
	},
	"Draft Picks": {
		width: "100%",
	},
});

const AssetList = ({
	config,
	handleBulk,
	handleToggle,
	numDraftRounds,
	picks,
	roster,
	userOrOther,
}: {
	config: TableConfig;
	handleBulk: HandleBulk;
	handleToggle: HandleToggle;
	numDraftRounds: number;
	picks: Picks;
	roster: Roster;
	userOrOther: UserOrOther;
}) => {
	config.updateColumn({ width: "100%" }, "Name");
	config.addColumn(
		{
			title: "",
			key: "include",
			sortSequence: [],
			noSearch: true,
			template: ({ p, c, vars }) => (
				<input
					type="checkbox"
					title={p.untradableMsg}
					checked={p.included}
					disabled={p.untradable}
					onChange={() => {
						handleToggle(userOrOther, "player", "include", p.pid);
					}}
				/>
			),
		},
		0,
	);
	config.addColumn(
		{
			title: "X",
			key: "exclude",
			sortSequence: [],
			noSearch: true,
			template: ({ p, c, vars }) => (
				<input
					type="checkbox"
					title={p.untradableMsg ?? "Exclude this player from counter offers"}
					checked={p.excluded || p.untradable}
					disabled={p.untradable}
					onChange={() => {
						handleToggle(userOrOther, "player", "exclude", p.pid);
					}}
				/>
			),
		},
		1,
	);
	const playerCols = [...config.columns];

	const playerRows = genPlayerRows(roster, playerCols, config);

	const pickRows = genPickRows(picks, handleToggle, userOrOther);

	const userOrOtherKey = `${userOrOther[0].toUpperCase()}${userOrOther.slice(
		1,
	)}`;

	return (
		<div className="row">
			<div className="col-xl-9">
				<Dropdown className="d-inline-block">
					<Dropdown.Toggle
						variant="secondary"
						id={`trade-players-bulk-${userOrOtherKey}`}
						className="btn-sm"
					>
						Bulk exclude
					</Dropdown.Toggle>
					<Dropdown.Menu>
						<Dropdown.Item
							onClick={() => {
								handleBulk("check", userOrOther, "player");
							}}
						>
							Make all untradeable
						</Dropdown.Item>
						<Dropdown.Item
							onClick={() => {
								handleBulk("clear", userOrOther, "player");
							}}
						>
							Clear all untradeable
						</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown>
				<DataTable
					className="datatable-negative-margin-top"
					cols={playerCols}
					config={config}
					defaultSort={["Ovr", "desc"]}
					name={`Trade:${userOrOtherKey}`}
					rows={playerRows}
				/>
			</div>
			<div className="col-xl-3">
				<Dropdown className="d-inline-block">
					<Dropdown.Toggle
						variant="secondary"
						id={`trade-picks-bulk-${userOrOtherKey}`}
						className="btn-sm mb-2"
					>
						Bulk exclude
					</Dropdown.Toggle>
					<Dropdown.Menu>
						<Dropdown.Item
							onClick={() => {
								handleBulk("check", userOrOther, "pick");
							}}
						>
							Make all untradeable
						</Dropdown.Item>
						{range(numDraftRounds).map(i => (
							<Dropdown.Item
								key={i}
								onClick={() => {
									handleBulk("check", userOrOther, "pick", i + 1);
								}}
							>
								Make all {helpers.ordinal(i + 1)} round picks untradeable
							</Dropdown.Item>
						))}
						<Dropdown.Item
							onClick={() => {
								handleBulk("clear", userOrOther, "pick");
							}}
						>
							Clear all untradeable
						</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown>
				<DataTable
					cols={pickCols}
					defaultSort={[1, "asc"]}
					hideAllControls
					name={`Trade:Picks:${userOrOtherKey}`}
					rows={pickRows}
				/>
			</div>
		</div>
	);
};

export default AssetList;

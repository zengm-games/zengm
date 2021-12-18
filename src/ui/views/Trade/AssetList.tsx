import range from "lodash-es/range";
import PropTypes from "prop-types";
import { DataTable, PlayerNameLabels } from "../../components";
import { getCols, helpers } from "../../util";
import type { View, Player } from "../../../common/types";
import { Dropdown } from "react-bootstrap";
import type { TableConfig } from "../../util/TableConfig";
import type { ColTemp } from "../../util/columns/getCols";
import type { Col } from "../../components/DataTable";
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
	handleToggle: HandleToggle,
	userOrOther: UserOrOther,
	playerCols: Col[],
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
	handleBulk,
	handleToggle,
	numDraftRounds,
	picks,
	roster,
	config,
	userOrOther,
}: {
	handleBulk: HandleBulk;
	handleToggle: HandleToggle;
	numDraftRounds: number;
	picks: Picks;
	roster: Roster;
	config: TableConfig;
	userOrOther: UserOrOther;
}) => {
	const playerCols = [
		{
			title: "",
			key: "include",
			sortSequence: [],
			noSearch: true,
			template: (p: Player, c: ColTemp, vars: object) => (
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
		{
			title: "X",
			key: "exclude",
			sortSequence: [],
			noSearch: true,
			template: (p: Player, c: ColTemp, vars: object) => (
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
		...config.columns,
	];

	const playerRows = genPlayerRows(
		roster,
		handleToggle,
		userOrOther,
		playerCols,
		config,
	);

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
					config={config}
					cols={playerCols}
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
					legacyCols={pickCols}
					defaultSort={["col1", "asc"]}
					hideAllControls
					name={`Trade:Picks:${userOrOtherKey}`}
					rows={pickRows}
				/>
			</div>
		</div>
	);
};

AssetList.propTypes = {
	handleToggle: PropTypes.func.isRequired,
	picks: PropTypes.array.isRequired,
	roster: PropTypes.array.isRequired,
	config: PropTypes.object.isRequired,
	userOrOther: PropTypes.oneOf(["other", "user"]).isRequired,
};

export default AssetList;

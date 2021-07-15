import range from "lodash-es/range";
import PropTypes from "prop-types";
import { DataTable, PlayerNameLabels } from "../../components";
import { getCols, helpers } from "../../util";
import type { View } from "../../../common/types";
import { Dropdown } from "react-bootstrap";

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
type Stats = TradeProps["stats"];
type Picks = TradeProps["userRoster"];
type Roster = TradeProps["otherRoster"];

const genPlayerRows = (
	players: Roster,
	handleToggle: HandleToggle,
	userOrOther: UserOrOther,
	stats: Stats,
	challengeNoRatings: boolean,
) => {
	return players.map(p => {
		return {
			key: p.pid,
			data: [
				<input
					type="checkbox"
					title={p.untradableMsg}
					checked={p.included}
					disabled={p.untradable}
					onChange={() => {
						handleToggle(userOrOther, "player", "include", p.pid);
					}}
				/>,
				<input
					type="checkbox"
					title={p.untradableMsg ?? "Exclude this player from counter offers"}
					checked={p.excluded || p.untradable}
					disabled={p.untradable}
					onChange={() => {
						handleToggle(userOrOther, "player", "exclude", p.pid);
					}}
				/>,
				<PlayerNameLabels
					injury={p.injury}
					jerseyNumber={p.jerseyNumber}
					pid={p.pid}
					skills={p.ratings.skills}
					watch={p.watch}
				>
					{p.name}
				</PlayerNameLabels>,
				p.ratings.pos,
				p.age,
				!challengeNoRatings ? p.ratings.ovr : null,
				!challengeNoRatings ? p.ratings.pot : null,
				helpers.formatCurrency(p.contract.amount, "M"),
				p.contract.exp,
				...stats.map(stat => helpers.roundStat(p.stats[stat], stat)),
			],
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
	challengeNoRatings,
	handleBulk,
	handleToggle,
	numDraftRounds,
	picks,
	roster,
	stats,
	userOrOther,
}: {
	challengeNoRatings: boolean;
	handleBulk: HandleBulk;
	handleToggle: HandleToggle;
	numDraftRounds: number;
	picks: Picks;
	roster: Roster;
	stats: Stats;
	userOrOther: UserOrOther;
}) => {
	const playerCols = getCols(
		[
			"",
			"X",
			"Name",
			"Pos",
			"Age",
			"Ovr",
			"Pot",
			"Contract",
			"Exp",
			...stats.map(stat => `stat:${stat}`),
		],
		{
			"": {
				sortSequence: [],
				noSearch: true,
			},
			Name: {
				width: "100%",
			},
		},
	);

	const playerRows = genPlayerRows(
		roster,
		handleToggle,
		userOrOther,
		stats,
		challengeNoRatings,
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
					cols={playerCols}
					defaultSort={[5, "desc"]}
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

AssetList.propTypes = {
	handleToggle: PropTypes.func.isRequired,
	picks: PropTypes.array.isRequired,
	roster: PropTypes.array.isRequired,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
	userOrOther: PropTypes.oneOf(["other", "user"]).isRequired,
};

export default AssetList;

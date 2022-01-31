import { idb } from "../../worker/db";
import getCols, { LeagueVars, MetaCol } from "./columns/getCols";
import { cloneDeep, uniq } from "lodash-es";
import { g } from "../../worker/util";

export class TableConfig {
	public fallback: string[];
	public columns: MetaCol[];
	public tableName: string;
	public vars?: LeagueVars;

	public statsNeeded: string[] = [];
	public ratingsNeeded: string[] = [];
	public attrsNeeded: string[] = ["pid"];

	constructor(
		tableName: string,
		fallback: string[],
		columns: MetaCol[] = [],
		vars?: LeagueVars,
	) {
		this.tableName = tableName;
		this.fallback = fallback;
		this.columns = columns;
		if (vars) this.vars = vars;
	}

	addColumn(column: MetaCol, pos: number) {
		const colIndex = this.columns.findIndex(c => c.key === column.key);
		if (colIndex !== -1) {
			Object.assign(this.columns[colIndex], column);
		} else {
			this.columns.splice(pos, 0, column);
		}
	}

	updateColumn(column: Partial<MetaCol>, key: string) {
		const colIndex = this.columns.findIndex(c => c.key === key);
		if (colIndex !== -1) {
			Object.assign(this.columns[colIndex], column);
		}
	}

	setVar(key: keyof LeagueVars, value: any) {
		if (this.vars) {
			// @ts-ignore
			this.vars[key] = value;
		}
		return this;
	}

	static unserialize(_config: TableConfig) {
		const serialized = cloneDeep(_config);
		return new TableConfig(
			serialized.tableName,
			serialized.fallback,
			serialized.columns,
			serialized.vars,
		);
	}

	public async load() {
		const colOptions: string[] | undefined = await idb.meta.get(
			"tables",
			this.tableName,
		);
		this.columns = getCols(colOptions ?? this.fallback);
		this.statsNeeded = uniq(
			this.columns.reduce(
				(needed: string[], c: MetaCol) => needed.concat(c.stats ?? []),
				[],
			),
		);
		this.ratingsNeeded = uniq(
			this.columns.reduce(
				(needed: string[], c: MetaCol) => needed.concat(c.ratings ?? []),
				[],
			),
		);
		this.attrsNeeded = uniq(
			this.columns.reduce(
				(needed: string[], c: MetaCol) => needed.concat(c.attrs ?? []),
				[],
			),
		);
		this.vars = {
			season: g.get("season"),
			userTid: g.get("userTid"),
			godMode: g.get("godMode"),
			spectator: g.get("spectator"),
			phase: g.get("phase"),
			challengeNoRatings: g.get("challengeNoRatings"),
			challengeNoDraftPicks: g.get("challengeNoDraftPicks"),
			challengeNoFreeAgents: g.get("challengeNoFreeAgents"),
			challengeNoTrades: g.get("challengeNoTrades"),
			salaryCapType: g.get("salaryCapType"),
			salaryCap: g.get("salaryCap"),
			maxContract: g.get("maxContract"),
			minContract: g.get("minContract"),
		};
	}
}

import { idb } from "../../worker/db";
import getCols, { MetaCol } from "./columns/getCols";
import { uniq } from "lodash-es";
import { g } from "../../worker/util";

export class TableConfig {
	get ratingsNeeded(): string[] {
		return this._ratingsNeeded ?? [];
	}
	get statsNeeded(): string[] {
		return this._statsNeeded ?? [];
	}
	get attrsNeeded(): string[] {
		return this._attrsNeeded ?? [];
	}

	public fallback: string[];
	public columns: MetaCol[];
	public tableName: string;
	public vars: { [key: string]: any };

	private _statsNeeded: string[] = [];
	private _ratingsNeeded: string[] = [];
	private _attrsNeeded: string[] = ["pid"];

	constructor(
		tableName: string,
		fallback: string[],
		columns: MetaCol[] = [],
		vars: { [key: string]: any } = {},
	) {
		this.tableName = tableName;
		this.fallback = fallback;
		this.columns = columns;
		this.vars = vars;
	}

	addColumn(column: MetaCol, pos: number) {
		const colIndex = this.columns.findIndex(c => c.key === column.key);
		if (colIndex !== -1) {
			Object.assign(this.columns[colIndex], column);
		} else {
			this.columns.splice(pos, 0, column);
		}
	}

	static unserialize(_config: TableConfig) {
		return new TableConfig(
			_config.tableName,
			_config.fallback,
			_config.columns,
			_config.vars,
		);
	}

	public async load() {
		const colOptions: string[] | undefined = await idb.meta.get(
			"tables",
			this.tableName,
		);
		this.columns = getCols(colOptions ?? this.fallback);
		this._statsNeeded = uniq(
			this.columns.reduce(
				(needed: string[], c: MetaCol) => needed.concat(c.stats ?? []),
				[],
			),
		);
		this._ratingsNeeded = uniq(
			this.columns.reduce(
				(needed: string[], c: MetaCol) => needed.concat(c.ratings ?? []),
				[],
			),
		);
		this._attrsNeeded = uniq(
			this.columns.reduce(
				(needed: string[], c: MetaCol) => needed.concat(c.attrs ?? []),
				[],
			),
		);
		this.vars = {
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

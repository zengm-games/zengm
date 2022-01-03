import { idb } from "../../worker/db";
import getCols from "./columns/getCols";
import { uniq } from "lodash-es";
import type { Col } from "../components/DataTable";
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
	public columns: Partial<Col>[];
	public tableName: string;
	public vars: { [key: string]: any };

	private _statsNeeded: string[] = [];
	private _ratingsNeeded: string[] = [];
	private _attrsNeeded: string[] = ["pid"];

	constructor(tableName: string, fallback: string[]) {
		this.tableName = tableName;
		this.fallback = fallback;
		this.columns = [];
		this.vars = {
			userTid: g.get("userTid"),
			godMode: g.get("godMode"),
			spectator: g.get("spectator"),
			phase: g.get("phase"),
			challengeNoRatings: g.get("challengeNoRatings"),
			challengeNoDraftPicks: g.get("challengeNoDraftPicks"),
			challengeNoFreeAgents: g.get("challengeNoFreeAgents"),
			challengeNoTrades: g.get("challengeNoTrades"),
			hardCap: g.get("hardCap"),
			salaryCap: g.get("salaryCap"),
			maxContract: g.get("maxContract"),
			minContract: g.get("minContract"),
		};
	}

	public async load() {
		const colOptions: string[] | undefined = await idb.meta.get(
			"tables",
			this.tableName,
		);
		this.columns = getCols(colOptions ?? this.fallback);
		this._statsNeeded = uniq(
			this.columns.reduce((needed, c) => needed.concat(c.stats ?? []), []),
		);
		this._ratingsNeeded = uniq(
			this.columns.reduce((needed, c) => needed.concat(c.ratings ?? []), []),
		);
		this._attrsNeeded = uniq(
			this.columns.reduce((needed, c) => needed.concat(c.attrs ?? []), []),
		);
	}
}

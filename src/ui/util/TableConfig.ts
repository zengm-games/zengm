import { idb } from "../../worker/db";
// import type { ColTemp } from "./columns/getCols";
import getCols from "./columns/getCols";
import { uniq } from "lodash-es";
import type { Col } from "../components/DataTable";

export class TableConfig {
	get ratingsNeeded(): string[] | undefined {
		return this._ratingsNeeded;
	}
	get statsNeeded(): string[] | undefined {
		return this._statsNeeded;
	}

	protected fallback: string[];
	private _statsNeeded?: string[];
	private _ratingsNeeded?: string[];
	public columns: Col[];
	public tableName: string;

	constructor(tableName: string, fallback: string[]) {
		this.tableName = tableName;
		this.fallback = fallback;
		this.columns = [];
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
	}
}

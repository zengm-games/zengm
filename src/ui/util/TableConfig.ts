import { idb } from "../../worker/db";
import getCols from "./columns/getCols";
import { uniq } from "lodash-es";
import type { Col } from "../components/DataTable";

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
	public columns: Col[];
	public tableName: string;

	private _statsNeeded: string[] = [];
	private _ratingsNeeded: string[] = [];
	private _attrsNeeded: string[] = [];

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
		this._attrsNeeded = uniq(
			this.columns.reduce((needed, c) => needed.concat(c.attrs ?? []), []),
		);
	}
}

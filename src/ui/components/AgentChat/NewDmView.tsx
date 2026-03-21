import { useMemo, useState } from "react";
import { orderBy } from "../../../common/utils.ts";
import {
	useAgentChatUi,
	type Conversation,
	type EntityContext,
} from "../../util/agentChatUi.ts";
import { useLocalPartial } from "../../util/index.ts";
import toWorker from "../../util/toWorker.ts";

type RosterRunBeforeTeam = {
	strategy?: string;
	region?: string;
	name?: string;
	seasonAttrs?: { won?: number; lost?: number };
};

export default function NewDmView() {
	const openInbox = useAgentChatUi((s) => s.openInbox);
	const upsertConversation = useAgentChatUi((s) => s.upsertConversation);
	const openConversation = useAgentChatUi((s) => s.openConversation);

	const { teamInfoCache, userTid, season } = useLocalPartial([
		"teamInfoCache",
		"userTid",
		"season",
	]);

	const [query, setQuery] = useState("");
	const [loadingTid, setLoadingTid] = useState<number | null>(null);

	const teams = useMemo(() => {
		const rows: {
			tid: number;
			abbrev: string;
			region: string;
			name: string;
		}[] = [];
		for (const [tid, t] of teamInfoCache.entries()) {
			if (!t || tid === userTid || t.disabled) {
				continue;
			}
			rows.push({
				tid,
				abbrev: t.abbrev,
				region: t.region,
				name: t.name,
			});
		}
		const sorted = orderBy(rows, ["region", "name"]);
		const q = query.trim().toLowerCase();
		if (!q) {
			return sorted;
		}
		return sorted.filter(
			(row) =>
				row.abbrev.toLowerCase().includes(q) ||
				row.name.toLowerCase().includes(q),
		);
	}, [teamInfoCache, userTid, query]);

	const handleSelect = async (row: (typeof teams)[number]) => {
		setLoadingTid(row.tid);
		try {
			const rosterData = await toWorker("main", "runBefore", {
				viewId: "roster",
				params: {
					abbrev: `${row.abbrev}_${row.tid}`,
					season: String(season),
					playoffs: "regularSeason",
				},
				ctxBBGM: {},
				updateEvents: [],
				prevData: {},
			});

			if (rosterData === undefined) {
				return;
			}

			const rd = rosterData as {
				errorMessage?: string;
				t?: RosterRunBeforeTeam;
			};

			if (rd.errorMessage || !rd.t) {
				return;
			}

			const t = rd.t;
			const strategyRaw = t.strategy;
			const strategy: EntityContext["strategy"] =
				strategyRaw === "contending" || strategyRaw === "rebuilding"
					? strategyRaw
					: "rebuilding";

			const entityContext: EntityContext = {
				tid: row.tid,
				abbrev: row.abbrev,
				region: t.region ?? row.region,
				name: t.name ?? row.name,
				strategy,
				won: t.seasonAttrs?.won ?? 0,
				lost: t.seasonAttrs?.lost ?? 0,
			};

			const conv: Conversation = {
				id: `gm-${row.tid}`,
				type: "gm",
				name: `${entityContext.region} ${entityContext.name} GM`,
				lastMessage: "",
				updatedAt: Date.now(),
				entityContext,
			};

			upsertConversation(conv);
			openConversation(conv.id);
		} finally {
			setLoadingTid(null);
		}
	};

	return (
		<div className="d-flex flex-column h-100">
			<div className="d-flex align-items-center gap-2 border-bottom px-2 py-2">
				<button
					type="button"
					className="btn btn-sm btn-outline-secondary"
					onClick={() => openInbox()}
				>
					← Back
				</button>
				<span className="fw-semibold">New Message</span>
			</div>
			<div className="px-2 pt-2">
				<input
					type="search"
					className="form-control form-control-sm"
					placeholder="Search teams..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					autoComplete="off"
				/>
			</div>
			<div className="list-group list-group-flush flex-grow-1 overflow-auto mt-2">
				{teams.map((row) => (
					<button
						key={row.tid}
						type="button"
						className="list-group-item list-group-item-action text-start border-0 border-bottom rounded-0"
						disabled={loadingTid !== null}
						onClick={() => void handleSelect(row)}
					>
						{row.region} {row.name}
					</button>
				))}
			</div>
		</div>
	);
}

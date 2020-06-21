import React, { useState } from "react";
import useTitleBar from "../hooks/useTitleBar";
import type { View, ScheduledEvent, LocalStateUI } from "../../common/types";
import { helpers, getCols, useLocal } from "../util";
import { DataTable } from "../components";
import { PHASE_TEXT } from "../../common";
import { options } from "./GodMode";

const godModeOptions: Record<
	typeof options[number]["key"],
	typeof options[number]
> = {};
for (const option of options) {
	godModeOptions[option.key] = option;
}

const gameAttributeName = (key: string) => {
	if ((godModeOptions as any)[key]) {
		return (godModeOptions as any)[key].name;
	}

	if (key === "confs") {
		return "Conferences";
	}

	if (key === "divs") {
		return "Divisions";
	}

	return key;
};

const formatSeason = (scheduledEvent: ScheduledEvent) => {
	const phaseText = PHASE_TEXT[scheduledEvent.phase]
		? PHASE_TEXT[scheduledEvent.phase]
		: "???";
	return `${scheduledEvent.season} ${phaseText}`;
};

const formatType = (type: ScheduledEvent["type"]) => {
	if (type === "contraction") {
		return "Contraction";
	}

	if (type === "expansionDraft") {
		return "Expansion";
	}

	if (type === "gameAttributes") {
		return "League settings";
	}

	if (type === "teamInfo") {
		return "Team info";
	}
};

const ViewEvent = ({
	all,
	current,
	teamInfoCache,
}: {
	all: ScheduledEvent[];
	current: ScheduledEvent;
	teamInfoCache: LocalStateUI["teamInfoCache"];
}) => {
	if (current.type === "contraction") {
		const tid = current.info.tid;
		if (tid < teamInfoCache.length) {
			const t = teamInfoCache[tid];
			return (
				<>
					{t.region} {t.name}
					<br />
					Team ID: {tid}
				</>
			);
		}

		// Must be a team that doesn't exist yet, look in all
		let t;
		for (const scheduledEvent of all) {
			if (scheduledEvent.type === "expansionDraft") {
				for (const t2 of scheduledEvent.info.teams) {
					if (t2.tid === tid) {
						t = t2;
						break;
					}
				}
			}
			if (t) {
				break;
			}
		}

		if (t) {
			return (
				<>
					{t.region} {t.name} (future expansion team)
					<br />
					Team ID: {t.tid}
				</>
			);
		}

		return (
			<div className="text-danger">
				Invalid team
				<br />
				Team ID: {tid}
			</div>
		);
	}

	if (current.type === "expansionDraft") {
		return (
			<ul className="list-unstyled mb-0">
				{current.info.teams.map((t, i) => (
					<li className={i > 0 ? "mt-3" : undefined} key={i}>
						{t.region} {t.name}
						{t.tid !== undefined ? (
							<>
								<br />
								Team ID: {t.tid}
							</>
						) : null}
					</li>
				))}
			</ul>
		);
	}

	if (current.type === "gameAttributes") {
		console.log(current.info);
		return (
			<table className="table table-nonfluid">
				<tbody>
					{Object.entries(current.info).map(([key, value]) => {
						return (
							<tr key={key}>
								<td>{gameAttributeName(key)}</td>
								<td>
									{key === "confs" || key === "divs"
										? (value as any[]).map(x => <div>{x.name}</div>)
										: JSON.stringify(value)}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		);
	}

	return <pre className="mb-0">{JSON.stringify(current.info, null, 2)}</pre>;
};

const ScheduledEvents = ({ scheduledEvents }: View<"scheduledEvents">) => {
	useTitleBar({
		title: "Scheduled Events",
	});

	const teamInfoCache = useLocal(state => state.teamInfoCache);

	console.log(scheduledEvents);

	const cols = getCols("Season", "Type", "", "");
	cols[3].width = "100%";

	const rows = scheduledEvents.map(scheduledEvent => {
		return {
			key: scheduledEvent.id,
			data: [
				{
					value: formatSeason(scheduledEvent),
					sortValue: `${scheduledEvent.season} ${scheduledEvent.phase} ${scheduledEvent.id}`,
				},
				formatType(scheduledEvent.type),
				<ViewEvent
					all={scheduledEvents}
					current={scheduledEvent}
					teamInfoCache={teamInfoCache}
				/>,
				"Edit | Delete",
			],
		};
	});

	return (
		<>
			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				name="ScheduledEvents"
				rows={rows}
			/>
		</>
	);
};

export default ScheduledEvents;

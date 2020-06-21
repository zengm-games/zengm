import React, { useState } from "react";
import useTitleBar from "../hooks/useTitleBar";
import type { View, ScheduledEvent, LocalStateUI } from "../../common/types";
import { helpers, getCols, useLocal } from "../util";
import classNames from "classnames";
import groupBy from "lodash/groupBy";
import { DataTable } from "../components";
import { PHASE_TEXT } from "../../common";

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
					ID number: {tid}
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
					ID number: {t.tid}
				</>
			);
		}

		return (
			<div className="text-danger">
				Invalid team
				<br />
				ID number: {tid}
			</div>
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

	const cols = getCols("Season", "Phase", "Type", "", "");
	cols[3].width = "100%";

	const rows = scheduledEvents.map(scheduledEvent => {
		return {
			key: scheduledEvent.id,
			data: [
				scheduledEvent.season,
				{
					value: PHASE_TEXT[scheduledEvent.phase]
						? helpers.upperCaseFirstLetter(PHASE_TEXT[scheduledEvent.phase])
						: "???",
					sortValue: scheduledEvent.phase,
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

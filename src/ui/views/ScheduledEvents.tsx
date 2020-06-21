import React, { useState } from "react";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { helpers, getCols } from "../util";
import classNames from "classnames";
import groupBy from "lodash/groupBy";
import { DataTable } from "../components";
import { PHASE_TEXT } from "../../common";

const ScheduledEvents = ({ scheduledEvents }: View<"scheduledEvents">) => {
	useTitleBar({
		title: "Scheduled Events",
	});

	console.log(scheduledEvents);

	const cols = getCols("Season", "Phase", "Type", "");

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
				scheduledEvent.type,
				<pre className="mb-0">
					{JSON.stringify(scheduledEvent.info, null, 2)}
				</pre>,
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

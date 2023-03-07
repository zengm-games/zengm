import type { ChangeEvent } from "react";
import { realtimeUpdate, toWorker, useLocalPartial } from "../util";
import orderBy from "lodash-es/orderBy";
import { MOBILE_AD_BOTTOM_MARGIN } from "../../common";

const setUserTid = async (userTid: number) => {
	await toWorker("main", "updateGameAttributes", {
		userTid,
	});
	realtimeUpdate(["firstRun"]);
};

const handleChange = async (event: ChangeEvent<HTMLSelectElement>) => {
	const userTid = parseInt(event.target.value);
	await setUserTid(userTid);
};

const MultiTeamMenu = () => {
	const state = useLocalPartial([
		"stickyFooterAd",
		"stickyFormButtons",
		"teamInfoCache",
		"userTid",
		"userTids",
	]);

	// Hide if not multi team or not loaded yet
	if (state.userTids.length <= 1 || state.stickyFormButtons) {
		return null;
	}

	const teams = orderBy(
		state.userTids.map(tid => ({
			region: state.teamInfoCache[tid]?.region,
			name: state.teamInfoCache[tid]?.name,
			tid,
		})),
		["region", "name", "tid"],
	);

	const ind = teams.findIndex(t => t.tid === state.userTid);

	const prev = async () => {
		const t = teams[ind - 1];

		if (t !== undefined) {
			await setUserTid(t.tid);
		}
	};
	const next = async () => {
		const t = teams[ind + 1];

		if (t !== undefined) {
			await setUserTid(t.tid);
		}
	};

	const prevDisabled = ind < 0 || ind === 0;
	const nextDisabled = ind < 0 || ind === state.userTids.length - 1;

	let bottom = 0;
	if (state.stickyFooterAd) {
		bottom += MOBILE_AD_BOTTOM_MARGIN;
	}

	return (
		<div className="multi-team-menu d-flex align-items-end" style={{ bottom }}>
			<button
				className="btn btn-link p-0 mb-1"
				disabled={prevDisabled}
				onClick={prev}
				title="Previous Team"
			>
				<span className="glyphicon glyphicon-menu-left" />
			</button>
			<div className="flex-fill px-1">
				<select
					className="form-select"
					onChange={handleChange}
					value={state.userTid}
				>
					{teams.map(t => (
						<option key={t.tid} value={t.tid}>
							{t.region} {t.name}
						</option>
					))}
				</select>
			</div>
			<button
				className="btn btn-link p-0 mb-1"
				disabled={nextDisabled}
				onClick={next}
				title="Next Team"
			>
				<span className="glyphicon glyphicon-menu-right" />
			</button>
		</div>
	);
};

export default MultiTeamMenu;

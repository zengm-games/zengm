import { useState } from "react";
import { getCols } from "../../common/getCols.ts";
import {
	COACH_SLOT_NAMES,
	COACH_SLOTS,
	COACH_SPECIALTY_NAMES,
	getCoachQualityGrade,
	type CoachSlot,
} from "../../common/staff.ts";
import type { View } from "../../common/types.ts";
import { ActionButton } from "../components/ActionButton.tsx";
import { DataTable } from "../components/DataTable/index.tsx";
import type { DataTableRow } from "../components/DataTable/index.tsx";
import { MoreLinks } from "../components/MoreLinks.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { confirm } from "../util/confirm.tsx";
import { useLocal } from "../util/local.ts";
import { logEvent } from "../util/logEvent.ts";
import { toWorker } from "../util/toWorker.ts";

type Coach = View<"staff">["teamStaff"][number];

const coachName = (coach: Coach) => `${coach.firstName} ${coach.lastName}`;

const quality = (coachQuality: number) => {
	const grade = getCoachQualityGrade(coachQuality);

	return {
		searchValue: `${grade} ${coachQuality}`,
		sortValue: coachQuality,
		value: (
			<>
				{grade} <span className="text-body-secondary">({coachQuality})</span>
			</>
		),
	};
};

const logError = (error: unknown) => {
	logEvent({
		saveToDb: false,
		text: error instanceof Error ? error.message : String(error),
		type: "error",
	});
};

const Staff = ({
	abbrev,
	availableCoaches,
	budgetLevel,
	developmentLevel,
	teamName,
	teamRegion,
	teamStaff,
	tid,
}: View<"staff">) => {
	useTitleBar({
		title: "Staff",
		dropdownView: "staff",
		dropdownFields: { teams: abbrev },
	});

	const { gameSimInProgress, spectator, userTids } = useLocal([
		"gameSimInProgress",
		"spectator",
		"userTids",
	]);

	const [processing, setProcessing] = useState<string>();
	const editable = userTids.includes(tid) && !spectator && !gameSimInProgress;

	const coachesBySlot = new Map<CoachSlot, Coach>();
	for (const coach of teamStaff) {
		if (coach.slot !== undefined) {
			coachesBySlot.set(coach.slot, coach);
		}
	}
	const openSlots = COACH_SLOTS.filter((slot) => !coachesBySlot.has(slot));

	const handleHire = async (coachId: number, slot: CoachSlot) => {
		const processingKey = `hire-${coachId}-${slot}`;
		setProcessing(processingKey);
		try {
			await toWorker("main", "hireCoach", {
				coachId,
				slot,
				tid,
			});
		} catch (error) {
			logError(error);
		} finally {
			setProcessing(undefined);
		}
	};

	const handleFire = async (coach: Coach) => {
		const proceed = await confirm(`Fire ${coachName(coach)}?`, {
			okText: "Fire",
		});
		if (!proceed) {
			return;
		}

		const processingKey = `fire-${coach.coachId}`;
		setProcessing(processingKey);
		try {
			await toWorker("main", "fireCoach", {
				coachId: coach.coachId,
				tid,
			});
		} catch (error) {
			logError(error);
		} finally {
			setProcessing(undefined);
		}
	};

	const staffCols = getCols(
		["Slot", "Name", "Age", "Specialty", "Quality", "Action"],
		{
			Action: {
				noSearch: true,
			},
			Name: {
				width: "100%",
			},
		},
	);

	const staffRows: DataTableRow[] = COACH_SLOTS.map((slot) => {
		const coach = coachesBySlot.get(slot);
		if (!coach) {
			return {
				key: slot,
				data: [
					COACH_SLOT_NAMES[slot],
					{
						searchValue: "Vacant",
						sortValue: "",
						value: <span className="text-body-secondary">Vacant</span>,
					},
					null,
					null,
					null,
					null,
				],
			};
		}

		return {
			key: coach.coachId,
			data: [
				COACH_SLOT_NAMES[slot],
				coachName(coach),
				coach.age,
				COACH_SPECIALTY_NAMES[coach.specialty],
				quality(coach.quality),
				editable ? (
					<ActionButton
						className="btn-sm"
						processing={processing === `fire-${coach.coachId}`}
						processingText="Firing"
						variant="danger"
						onClick={() => {
							void handleFire(coach);
						}}
					>
						Fire
					</ActionButton>
				) : null,
			],
		};
	});

	const availableCols = getCols(
		["Name", "Age", "Specialty", "Quality", "Action"],
		{
			Action: {
				noSearch: true,
			},
			Name: {
				width: "100%",
			},
		},
	);

	const availableRows: DataTableRow[] = availableCoaches.map((coach) => {
		let action = null;
		if (editable) {
			if (openSlots.length === 0) {
				action = <span className="text-body-secondary">No open slots</span>;
			} else if (coach.quality > budgetLevel) {
				action = <span className="text-body-secondary">Budget too low</span>;
			} else {
				action = (
					<div className="d-flex flex-wrap gap-1">
						{openSlots.map((slot) => {
							const processingKey = `hire-${coach.coachId}-${slot}`;
							return (
								<ActionButton
									className="btn-sm"
									key={slot}
									processing={processing === processingKey}
									processingText="Hiring"
									variant="primary"
									onClick={() => {
										void handleHire(coach.coachId, slot);
									}}
								>
									{COACH_SLOT_NAMES[slot]}
								</ActionButton>
							);
						})}
					</div>
				);
			}
		}

		return {
			key: coach.coachId,
			data: [
				coachName(coach),
				coach.age,
				COACH_SPECIALTY_NAMES[coach.specialty],
				quality(coach.quality),
				action,
			],
		};
	});

	return (
		<>
			<MoreLinks type="team" page="staff" abbrev={abbrev} tid={tid} />

			<div className="d-flex flex-wrap gap-4 mb-3">
				<div>
					<div className="text-body-secondary">Team</div>
					<b>
						{teamRegion} {teamName}
					</b>
				</div>
				<div>
					<div className="text-body-secondary">Coaching budget</div>
					<b>
						{getCoachQualityGrade(budgetLevel)}{" "}
						<span className="text-body-secondary">({budgetLevel})</span>
					</b>
				</div>
				<div>
					<div className="text-body-secondary">Staff development</div>
					<b>
						{getCoachQualityGrade(developmentLevel)}{" "}
						<span className="text-body-secondary">({developmentLevel})</span>
					</b>
				</div>
			</div>

			<DataTable
				cols={staffCols}
				defaultSort={[0, "asc"]}
				name="StaffCurrent"
				rows={staffRows}
				title={<h2>Current staff</h2>}
			/>

			{availableRows.length > 0 ? (
				<DataTable
					cols={availableCols}
					defaultSort={[3, "desc"]}
					name="StaffAvailable"
					pagination
					rows={availableRows}
					title={<h2>Available coaches</h2>}
				/>
			) : (
				<>
					<h2>Available coaches</h2>
					<p>None</p>
				</>
			)}
		</>
	);
};

export default Staff;

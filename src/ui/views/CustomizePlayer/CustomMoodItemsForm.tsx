import useDropdownOptions from "../../hooks/useDropdownOptions.tsx";
import { useLocalPartial } from "../../util/index.ts";

const CustomMoodItemsForm = ({
	godMode,
	handleChange,
	customMoodItems = [],
}: {
	godMode: boolean;
	handleChange: (
		type: string,
		field: string,
		event: {
			target: {
				value: any;
			};
		},
	) => void;
	customMoodItems:
		| {
				amount: string | number;
				text: string;
				tid?: number;
		  }[]
		| undefined;
}) => {
	const handleCustomMoodItemsChange = <
		Field extends "amount" | "text" | "tid" | "add" | "delete",
	>(
		index: number,
		field: Field,
		value?: Field extends "tid" ? number : string,
	) => {
		if (field === "delete") {
			customMoodItems.splice(index, 1);
		} else if (field === "add") {
			customMoodItems.push({
				amount: "0",
				text: "",
				tid: undefined,
			});
		} else {
			// @ts-ignore
			customMoodItems[index][field] = value;
		}
		handleChange("root", "customMoodItems", {
			target: {
				value: customMoodItems,
			},
		});
	};

	const teamsRaw = useDropdownOptions("teamsAndAll");
	const { teamInfoCache } = useLocalPartial(["teamInfoCache"]);
	const tidsByAbbrev: Record<string, number> = {};
	for (const [tid, t] of teamInfoCache.entries()) {
		tidsByAbbrev[t.abbrev] = tid;
	}
	const teams = teamsRaw.map((t) => {
		let tid: number | "all";
		if (t.key === "all") {
			tid = "all";
		} else {
			tid = tidsByAbbrev[t.key]!;
		}

		return {
			...t,
			tid,
		};
	});

	return (
		<>
			{customMoodItems.map(({ amount, text, tid }, i) => {
				return (
					<div className="d-flex align-items-end mb-3" key={i}>
						<div className="me-3 flex-shrink-0">
							{i === 0 ? <label className="form-label">Amount</label> : null}
							<input
								className="form-control"
								onChange={(event) => {
									handleCustomMoodItemsChange(i, "amount", event.target.value);
								}}
								type="text"
								value={amount}
								disabled={!godMode}
								style={{ width: 60 }}
							/>
						</div>
						<div className="me-3 flex-grow-1">
							{i === 0 ? <label className="form-label">Text</label> : null}
							<input
								className="form-control"
								onChange={(event) => {
									handleCustomMoodItemsChange(i, "text", event.target.value);
								}}
								type="text"
								value={text}
								disabled={!godMode}
							/>
						</div>
						<div className="me-2 flex-shrink-0">
							{i === 0 ? <label className="form-label">Team</label> : null}
							<select
								className="form-select"
								onChange={(event) => {
									let tid;
									if (event.target.value === "all") {
										tid = undefined;
									} else {
										tid = Number.parseInt(event.target.value);
									}
									handleCustomMoodItemsChange(i, "tid", tid);
								}}
								value={tid ?? "all"}
								disabled={!godMode}
							>
								{teams.map((t) => {
									return (
										<option key={t.tid} value={t.tid}>
											{Array.isArray(t.value) ? t.value[0]!.text : t.value}
										</option>
									);
								})}
							</select>
						</div>
						<div className="flex-shrink-0" style={{ fontSize: 20 }}>
							<button
								className="ms-3 text-danger btn btn-link p-0 border-0"
								onClick={() => {
									handleCustomMoodItemsChange(i, "delete");
								}}
								title="Delete"
								style={{ fontSize: 20 }}
								disabled={!godMode}
								type="button"
							>
								<span className="glyphicon glyphicon-remove" />
							</button>
						</div>
					</div>
				);
			})}
			<div className="d-flex">
				<button
					type="button"
					className="btn btn-secondary"
					onClick={() => {
						handleCustomMoodItemsChange(-1, "add");
					}}
					disabled={!godMode}
				>
					Add
				</button>
			</div>
		</>
	);
};

export default CustomMoodItemsForm;

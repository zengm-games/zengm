import React, { useEffect, useState } from "react";
import { POSITIONS, SKILLS } from "../../../common/constants";
import type FilterItem from "../../../worker/core/trade/filterItem";
import FilterGroup from "./FilterGroup";

interface tradeFilterProps {
	setFilters: (filters: filterType) => void;
	filters: filterType;
}
export type filterType = {
	[key: string]: FilterItem;
};

const POS = POSITIONS.filter(
	pos => !["GF", "FC", "F", "G", "KR", "PR"].includes(pos),
);

const SKILL = Object.values(SKILLS).map(skill => skill.label);

const TradeFilter = (props: tradeFilterProps) => {
	const [filters, setFilters] = useState<filterType>(props.filters);
	const [balancedOnly, setBalancedOnly] = useState(false);
	const [salaryCap, setSalaryCap] = useState("");

	const updateFilters = (type: string, value: string[]) => {
		if (value !== filters[type].filterData) {
			filters[type].update(value);
			setFilters({ ...filters });
			props.setFilters(filters);
		}
	};

	const toggleBalancedOnly = () => {
		setBalancedOnly(filters.salaryCap.filterData !== "-1");
		if (filters.salaryCap.filterData !== "-1") filters.salaryCap.update("-1");
		else filters.salaryCap.update("");
		props.setFilters(filters);
	};

	const clearFilters = () => {
		filters.salaryCap.update("");
		filters.pos.update([]);
		filters.skill.update([]);
		setFilters({ ...filters });
		setSalaryCap("");
		setBalancedOnly(false);
		props.setFilters(filters);
	};

	const setFilterSalaryCap = (
		e: React.ChangeEvent<HTMLInputElement>,
		validate = false,
	) => {
		let newVal = e.target.value;
		if (validate) {
			const numVal = Number(e.target.value);
			newVal = numVal ? numVal.toString() : "";
		}
		filters.salaryCap.update(newVal);
		setSalaryCap(newVal);
		props.setFilters(filters);
	};

	return (
		<div
			className="col mb-4"
			style={{ maxWidth: "fit-content", margin: "auto", userSelect: "none" }}
		>
			<div className="row">
				<h3>Filter Options</h3>
				<a
					onClick={clearFilters}
					className="ml-3 btn-md cursor-pointer vertical-center"
					title="clear"
				>
					<span className="text-align-middle">clear</span>
				</a>
			</div>
			<div className="row mb-1">
				<FilterGroup
					values={POS}
					statuses={filters}
					title="Position"
					type="pos"
					onUpdate={updateFilters}
				/>
			</div>
			<div className="row mb-2">
				<FilterGroup
					values={SKILL}
					statuses={filters}
					title="Skill"
					type="skill"
					onUpdate={updateFilters}
				/>
			</div>
			<div className="row mt-3">
				<strong
					className="mr-2"
					style={{ alignSelf: "center", fontSize: "0.86rem" }}
				>
					Salary (Max)
				</strong>
				<div className="input-group input-group-sm float-left finances-settings-field ml-2">
					<div className="input-group-prepend">
						<div className="input-group-text">$</div>
					</div>
					<input
						type="text"
						className="form-control"
						onChange={setFilterSalaryCap}
						onBlur={e => setFilterSalaryCap(e, true)}
						value={balancedOnly ? "" : salaryCap}
						disabled={balancedOnly}
					/>
					<div className="input-group-append">
						<div className="input-group-text">M</div>
					</div>
				</div>
				<div className="form-check ml-3 mt-1">
					<div className="">
						<label className="form-check-label">
							<input
								className="form-check-input"
								onChange={() => toggleBalancedOnly()}
								type="checkbox"
								checked={balancedOnly}
							/>
							Balanced trades only
						</label>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TradeFilter;

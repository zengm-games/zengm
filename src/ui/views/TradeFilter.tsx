import React, { useEffect, useState } from "react";
import { ToggleItem } from "../components/ToggleItem";
import { POSITIONS, SKILLS } from "../../common/constants";

interface tradeFilterProps {
	setFilters: (filters: filterType) => void;
	filters: filterType;
}
export type filterType = {
	balancedOnly: boolean;
	multi: {
		[key: string]: any[];
	};
	salaryCap: string;
};

const POS = POSITIONS.filter(
	pos => !["GF", "FC", "F", "G", "KR", "PR"].includes(pos),
);

const TradeFilter = (props: tradeFilterProps) => {
	const [filters, setFilters] = useState<filterType>(props.filters);
	const [salaryCap, setSalaryCap] = useState("");

	useEffect(() => {
		props.setFilters(filters);
	}, [filters]);

	useEffect(() => {
		populateExtendedPositions();
	}, [filters.multi.pos]);

	const toggleBalancedOnly = () => {
		setFilters(prevFilters => {
			return {
				...prevFilters,
				balancedOnly: !prevFilters.balancedOnly,
			};
		});
	};

	const populateExtendedPositions = () => {
		let extPos = [...filters.multi.pos];

		if (extPos.includes("PG") || extPos.includes("SG")) extPos.push("G");
		if (extPos.includes("PF") || extPos.includes("SF")) extPos.push("F");
		if (extPos.includes("PF") || extPos.includes("C")) extPos.push("FC");
		if (extPos.includes("SF") || extPos.includes("SG")) extPos.push("GF");

		setFilters(prevFilters => {
			return {
				...prevFilters,
				multi: { ...prevFilters.multi, posExt: extPos },
			};
		});
	};

	const toggleFilter = (value: string, type: string) => {
		//remove from filters if it already exists
		if (filters.multi[type].includes(value)) {
			setFilters(prevFilters => {
				const indexToRemove = prevFilters.multi[type].indexOf(value);
				const toreturn = {
					...prevFilters,
					multi: {
						...prevFilters.multi,
					},
				};
				toreturn.multi[type].splice(indexToRemove, 1);
				return toreturn;
			});
		}
		//or add it
		else {
			setFilters(prevFilters => {
				const newFilters = { ...prevFilters };
				newFilters.multi[type] = [...prevFilters.multi[type], value];
				return newFilters;
			});
		}
	};

	const clearFilters = () => {
		setFilters({
			salaryCap: "",
			balancedOnly: false,
			multi: { pos: [], extPos: [], skill: [] },
		});
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

		setFilters(prevFilters => {
			return {
				...prevFilters,
				salaryCap: newVal,
			};
		});
	};

	const CheckBox = (props: {
		value: string;
		type: string;
		tooltip: string | undefined;
	}) => {
		return (
			<ToggleItem
				key={props.value}
				text={props.value}
				onCheck={() => toggleFilter(props.value, props.type)}
				isChecked={filters.multi[props.type].includes(props.value)}
				className="mt-2"
				tooltip={props.tooltip}
			/>
		);
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
				<strong
					className="mr-2 mt-2"
					style={{ alignSelf: "center", fontSize: "0.86rem" }}
				>
					Position
				</strong>
				{POS.map(pos => (
					<CheckBox key={pos} value={pos} type="pos" tooltip={undefined} />
				))}
			</div>
			<div className="row mb-2">
				<strong
					className="mr-2 mt-2"
					style={{ alignSelf: "center", fontSize: "0.86rem" }}
				>
					Skill
				</strong>
				{Object.values(SKILLS).map(skill => (
					<CheckBox
						key={skill.label}
						value={skill.label}
						type="skill"
						tooltip={skill.description}
					/>
				))}
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
						value={filters.balancedOnly ? "" : filters.salaryCap}
						disabled={filters.balancedOnly}
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
								checked={filters.balancedOnly}
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

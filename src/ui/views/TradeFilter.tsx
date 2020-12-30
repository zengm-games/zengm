import React, { useEffect, useState } from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";

interface tradeFilterProps {
	setFilters: (filters: filterType) => void;
}
export type filterType = {
	balancedOnly: boolean;
	multi: {
		[key: string]: any[];
	};
	salaryCap: string;
};

const BB_POS = ["PG", "SG", "SF", "PF", "C"];
const BB_SKILLS = ["3", "A", "B", "Di", "Dp", "Po", "Ps", "R"];

const TradeFilter = (props: tradeFilterProps) => {
	const [filters, setFilters] = useState<filterType>({
		balancedOnly: false,
		multi: { pos: [], posExt: [], skill: [] },
		salaryCap: "",
	});
	const [filterVerbiage, setFilterVerbiage] = useState<string>("");

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

	useEffect(() => {
		let count = 0;
		if (filters.multi.pos && filters.multi.pos.length > 0) count++;
		if (filters.multi.skill && filters.multi.skill.length > 0) count++;
		if (filters.balancedOnly || filters.salaryCap) count++;

		setFilterVerbiage(count > 0 ? ` (${count} filters)` : "Filter");
	}, [filters]);

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
				return {
					...prevFilters,
					multi: {
						...prevFilters.multi,
						type: prevFilters.multi[type].splice(indexToRemove, 1),
					},
				};
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

	const CheckBox = (props: { value: string; type: string }) => {
		return (
			<div key={props.value}>
				<label className="form-check-label">
					<input
						className="form-check-input"
						onChange={() => toggleFilter(props.value, props.type)}
						type="checkbox"
						checked={filters.multi[props.type].includes(props.value)}
					/>
					{props.value}
				</label>
			</div>
		);
	};
	const filterContent = (
		<div className="col-md-auto">
			<div className="row mb-2">
				Add more options in a given category to broaden the search; utilize
				multiple categories to narrow it.
			</div>
			<div className="row">
				<div className="col-xs-auto">
					<strong>Pos</strong>
					<div className="form-check"></div>
					<div className="form-check">
						{BB_POS.map(pos => (
							<CheckBox key={pos} value={pos} type="pos" />
						))}
					</div>
				</div>
				<div className="col-xs-auto pl-3">
					<strong>Skill</strong>
					<div className="form-check">
						{BB_SKILLS.map(skill => (
							<CheckBox key={skill} value={skill} type="skill" />
						))}
					</div>
				</div>
				<div className="col-xs-auto pl-3">
					<strong>Salary (Combined)</strong>
					<div className="mt-2 mb-1">Less than:</div>
					<div className="input-group input-group-sm float-left finances-settings-field">
						<div className="input-group-prepend">
							<div className="input-group-text">$</div>
						</div>
						<input
							type="text"
							className="form-control"
							onChange={setFilterSalaryCap}
							onBlur={e => setFilterSalaryCap(e, true)}
							value={!filters.balancedOnly ? filters.salaryCap : ""}
							disabled={filters.balancedOnly}
						/>
						<div className="input-group-append">
							<div className="input-group-text">M</div>
						</div>
					</div>
					<div className="form-check mt-5">
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
		</div>
	);
	const popover = (
		<Popover id={"Filters"} style={{ maxWidth: 280 }}>
			<Popover.Title>
				{
					<>
						Trade Filters
						<a href="" className="float-right" onClick={clearFilters}>
							Clear
						</a>
					</>
				}
			</Popover.Title>
			<Popover.Content>{filterContent}</Popover.Content>
		</Popover>
	);

	return (
		<OverlayTrigger
			trigger="click"
			placement="right"
			overlay={popover}
			rootClose
		>
			<a className="btn btn-lg btn-link cursor-pointer" title="Filter">
				<span className="glyphicon glyphicon-filter align-middle"></span>{" "}
				<span className="text-align-middle">{filterVerbiage}</span>
			</a>
		</OverlayTrigger>
	);
};

export default TradeFilter;

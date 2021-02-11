import React, { useEffect, useState } from "react";
import { ToggleItem } from "../../components/ToggleItem";
import type { filterType } from "./TradeFilter";

export default function FilterGroup(props: {
	title: string;
	statuses: filterType;
	values: string[];
	type: string;
	onUpdate: (type: string, value: string[]) => void;
}) {
	const [activeFilters, setActiveFilters] = useState<string[]>(
		props.statuses[props.type].filterData,
	);

	useEffect(() => {
		setActiveFilters(props.statuses[props.type].filterData);
	}, [props.statuses]);

	useEffect(() => {
		props.onUpdate(props.type, activeFilters);
	}, [activeFilters]);

	const toggleFilter = (value: string, type: string) => {
		//remove from filters if it already exists
		if (activeFilters.includes(value)) {
			setActiveFilters(prevFilters => {
				const indexToRemove = prevFilters.indexOf(value);
				const toreturn = [...prevFilters];
				toreturn.splice(indexToRemove, 1);
				//props.onUpdate(type, toreturn)
				return toreturn;
			});
		}
		//or add it
		else {
			setActiveFilters(prevFilters => {
				//props.onUpdate(props.type, [...prevFilters, value])
				return [...prevFilters, value];
			});
		}
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
				checked={activeFilters.includes(props.value)}
				className="mt-2"
				tooltip={props.tooltip}
			/>
		);
	};

	return (
		<>
			<strong
				className="mr-2 mt-2"
				style={{ alignSelf: "center", fontSize: "0.86rem" }}
			>
				{props.title}
			</strong>
			{props.values.map(val => (
				<CheckBox key={val} value={val} type={props.type} tooltip={undefined} />
			))}
		</>
	);
}

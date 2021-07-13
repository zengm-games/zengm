import Bugsnag from "@bugsnag/browser";
import { useEffect, useRef } from "react";
import { NextPrevButtons } from "../../components";
import { logEvent } from "../../util";
import type { LeagueInfo } from "./types";

const quickValuesStyle = { height: 19 };

const LeagueMenu = <Value extends string>({
	getLeagueInfo,
	onDone,
	onLoading,
	quickValues,
	value,
	values,
	value2,
	values2,
	onNewValue2,
}: {
	getLeagueInfo: (value: Value, value2: number) => Promise<LeagueInfo>;
	onDone: (leagueInfo: any) => void;
	onLoading: (value: Value) => void;
	quickValues?: Value[];
	value: Value;
	values: { key: Value; value: string }[];
	value2?: number;
	values2?: { key: number; value: string }[];
	onNewValue2?: (key: number) => void;
}) => {
	const waitingForInfo = useRef<string | undefined>(value);

	const handleNewValue = async (newValue: Value, value2?: number) => {
		waitingForInfo.current = newValue;
		onLoading(newValue);

		try {
			const leagueInfo = await getLeagueInfo(newValue, value2 ?? 0);
			if (waitingForInfo.current === newValue) {
				onDone(leagueInfo);
			}
		} catch (error) {
			console.error(error);
			Bugsnag.notify(error);
			logEvent({
				type: "error",
				text: `Error loading real team data: ${error.message}`,
				saveToDb: false,
				persistent: true,
			});
		}
		if (waitingForInfo.current === newValue) {
			waitingForInfo.current = undefined;
		}
	};

	// Handle initial value
	useEffect(() => {
		handleNewValue(value, value2);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<>
			<div className="d-flex">
				<div className="flex-grow-1">
					<label htmlFor="new-league-season" className="mr-2">
						Season
					</label>
					<NextPrevButtons
						currentItem={value}
						items={values.map(value => value.key).reverse()}
						onChange={async newValue => {
							await handleNewValue(newValue, value2);
						}}
					/>
				</div>
				{quickValues
					? quickValues.map(key => (
							<button
								key={key}
								type="button"
								className="btn btn-link border-0 p-0 mb-1 ml-2"
								style={quickValuesStyle}
								onClick={() => {
									handleNewValue(key, value2);
								}}
							>
								{values.find(v => v.key === key)!.value}
							</button>
					  ))
					: null}
			</div>
			<div className="input-group mb-1">
				<select
					id="new-league-season"
					className="form-control"
					value={value}
					onChange={async event => {
						await handleNewValue(
							event.target.value as unknown as Value,
							value2,
						);
					}}
				>
					{values.map(({ key, value }) => {
						return (
							<option key={key} value={key}>
								{value}
							</option>
						);
					})}
				</select>
				{value2 !== undefined && values2 && onNewValue2 ? (
					<select
						className="form-control"
						onChange={event => {
							const value2 = parseInt(event.target.value);
							onNewValue2(value2);
							handleNewValue(value, value2);
						}}
						value={value2}
					>
						{values2.map(({ key, value }) => (
							<option key={key} value={key}>
								{value}
							</option>
						))}
					</select>
				) : null}
				<div className="input-group-append">
					<button
						className="btn btn-secondary"
						type="button"
						onClick={() => {
							const keys = values.map(v => v.key);
							const random = keys[Math.floor(Math.random() * keys.length)];

							if (value2 !== undefined && values2 && onNewValue2) {
								const keys2 = values2.map(v => v.key);
								const random2 = keys2[Math.floor(Math.random() * keys2.length)];
								onNewValue2(random2);
							}

							handleNewValue(random, value2);
						}}
					>
						Random
					</button>
				</div>
			</div>
		</>
	);
};

export default LeagueMenu;

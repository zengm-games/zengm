import clsx from "clsx";
import { helpers } from "../../util/index.ts";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import {
	categories,
	type LookingForState,
	type SetLookingForState,
} from "./useLookingForState.ts";
import { ResponsiveTableWrapper } from "../../components/index.tsx";

const LookingFor = ({
	disabled,
	state,
	setState,
}: {
	disabled: boolean;
	state: LookingForState;
	setState: SetLookingForState;
}) => {
	return (
		<div>
			<h3 className="mb-0">What are you looking for?</h3>
			<ResponsiveTableWrapper>
				<table>
					<tbody>
						{helpers.keys(categories).map((categoryKey) => {
							const category = categories[categoryKey];
							return (
								<tr className="pt-2" key={categoryKey}>
									<td style={{ width: 0 }} className="p-0 pt-2 text-end">
										{category.name}
									</td>
									<td className="p-0 ps-2 pt-2 d-flex gap-3">
										{category.options.map((option) => {
											const toggleButton = (
												<label
													key={option.key}
													className={clsx(
														"rounded-pill py-1 px-2",
														state[categoryKey][option.key]
															? "bg-secondary"
															: "bg-body-secondary",
													)}
												>
													<input
														type="checkbox"
														className="form-check-input me-1"
														disabled={disabled}
														checked={state[categoryKey][option.key]}
														onChange={() => {
															setState((state) => {
																const checked = !state[categoryKey][option.key];

																const newState = {
																	...state,
																	[categoryKey]: {
																		...state[categoryKey],
																		[option.key]: checked,
																	},
																};

																if (checked && categoryKey === "assets") {
																	if (option.key === "prospects") {
																		newState.assets.bestCurrentPlayers = false;
																	} else if (
																		option.key === "bestCurrentPlayers"
																	) {
																		newState.assets.prospects = false;
																	}
																}

																return newState;
															});
														}}
													/>
													{option.name}
												</label>
											);

											if (option.tooltip === undefined) {
												return toggleButton;
											}

											return (
												<OverlayTrigger
													key={option.key}
													overlay={<Tooltip>{option.tooltip}</Tooltip>}
												>
													{toggleButton}
												</OverlayTrigger>
											);
										})}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</ResponsiveTableWrapper>
		</div>
	);
};

export default LookingFor;

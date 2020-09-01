import PropTypes from "prop-types";
import React, { ChangeEvent } from "react";
import { getCols, helpers } from "../../util";

const rows: {
	[key: string]: string[];
}[][] =
	process.env.SPORT === "basketball"
		? [
				[
					{ Physical: ["hgt", "stre", "spd", "jmp", "endu"] },
					{ Shooting: ["ins", "dnk", "ft", "fg", "tp"] },
					{ Skill: ["oiq", "diq", "drb", "pss", "reb"] },
				],
		  ]
		: [
				[
					{ Physical: ["hgt", "stre", "spd", "endu"] },
					{ Passing: ["thv", "thp", "tha"] },
					{ "Rush/Rec": ["elu", "rtr", "hnd", "bsc"] },
				],
				[
					{ Blocking: ["rbk", "pbk"] },
					{ Defense: ["pcv", "tck", "prs", "rns"] },
					{ Kicking: ["kpw", "kac", "ppw", "pac"] },
				],
		  ];

const RatingsForm = ({
	godMode,
	handleChange,
	ratingsRow,
}: {
	godMode: boolean;
	handleChange: (
		type: string,
		field: string,
		event: ChangeEvent<HTMLInputElement>,
	) => void;
	ratingsRow: any;
}) => {
	return (
		<>
			{rows.map((row, i) => {
				return (
					<div className="row" key={i}>
						{row.map((block, j) => {
							return (
								<div key={j} className="col-4">
									{Object.entries(block).map(([title, ratings]) => {
										return (
											<React.Fragment key={title}>
												<h3>{title}</h3>
												{ratings.map(rating => {
													return (
														<div key={rating} className="form-group">
															<label>
																{getCols(`rating:${rating}`)[0].desc}
															</label>
															<input
																type="text"
																className="form-control"
																onChange={event => {
																	handleChange("rating", rating, event);
																}}
																value={
																	godMode
																		? ratingsRow[rating]
																		: Math.round(
																				helpers.bound(
																					ratingsRow[rating] + ratingsRow.fuzz,
																					0,
																					100,
																				),
																		  )
																}
																disabled={!godMode}
															/>
														</div>
													);
												})}
											</React.Fragment>
										);
									})}
								</div>
							);
						})}
					</div>
				);
			})}

			<div className="ml-1">
				<label className="form-check-label ml-3 mb-3">
					<input
						className="form-check-input"
						onChange={event => {
							handleChange("rating", "locked", event);
						}}
						type="checkbox"
						checked={!!ratingsRow.locked}
						disabled={!godMode}
					/>
					Lock ratings (ratings will not change as player ages)
				</label>
			</div>
		</>
	);
};

RatingsForm.propTypes = {
	handleChange: PropTypes.func,
	ratingsRow: PropTypes.object,
};

export default RatingsForm;

import PropTypes from "prop-types";
import React, { useState } from "react";
import DraftClass from "./DraftClass";
import useTitleBar from "../../hooks/useTitleBar";
import type { View } from "../../../common/types";
import { MoreLinks } from "../../components";

const PAGE_SIZE = 3;

const DraftScouting = ({
	challengeNoRatings,
	draftType,
	godMode,
	seasons,
}: View<"draftScouting">) => {
	const noDraft = draftType === "freeAgents";

	useTitleBar({ title: !noDraft ? "Draft Scouting" : "Upcoming Prospects" });

	const [page, setPage] = useState(0);

	if (seasons.length <= PAGE_SIZE && page !== 0) {
		setPage(0);
	}

	const pagination = seasons.length > PAGE_SIZE;
	const maxPage = Math.ceil(seasons.length / PAGE_SIZE) - 1;
	const enablePrevious = pagination && page > 0;
	const enableNext = pagination && page < maxPage;

	let seasonsToDisplay;
	if (pagination) {
		const indexStart = page * PAGE_SIZE;
		const indexEnd = indexStart + PAGE_SIZE;
		seasonsToDisplay = seasons.slice(indexStart, indexEnd);
	} else {
		seasonsToDisplay = seasons;
	}

	return (
		<>
			<MoreLinks type="draft" page="draft_scouting" draftType={draftType} />

			<p>
				The ratings shown are your scouts' projections for what the players'
				ratings will be when they enter the {!noDraft ? "draft" : "league"}. The
				further in the future, the more uncertainty there is in their estimates.
			</p>

			{pagination ? (
				<div className="d-flex flex-row-reverse">
					<div className="btn-group">
						<button
							className="btn btn-light-bordered"
							disabled={!enablePrevious}
							onClick={() => {
								setPage(page - 1);
							}}
						>
							Previous
						</button>
						<button
							className="btn btn-light-bordered"
							disabled={!enableNext}
							onClick={() => {
								setPage(page + 1);
							}}
						>
							Next
						</button>
					</div>
				</div>
			) : null}

			<div className="row">
				{seasonsToDisplay.map((info, offset) => {
					return (
						<div key={info.season} className="col-md-4 col-sm-6">
							<DraftClass
								challengeNoRatings={challengeNoRatings}
								godMode={godMode}
								offset={offset}
								players={info.players}
								season={info.season}
							/>
						</div>
					);
				})}
			</div>
		</>
	);
};

DraftScouting.propTypes = {
	draftType: PropTypes.string,
	seasons: PropTypes.arrayOf(
		PropTypes.shape({
			players: PropTypes.arrayOf(PropTypes.object).isRequired,
			season: PropTypes.number.isRequired,
		}),
	).isRequired,
};

export default DraftScouting;

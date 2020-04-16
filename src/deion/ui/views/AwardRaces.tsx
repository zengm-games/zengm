import PropTypes from "prop-types";
import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, getCols } from "../util";
import { PlayerNameLabels, DataTable } from "../components";
import { View } from "../../common/types";

const AwardRaces = ({
	awardCandidates,
	season,
	userTid,
}: View<"awardRaces">) => {
	useTitleBar({
		title: "Award Races",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "award_races",
		dropdownFields: {
			seasons: season,
		},
	});

	const globalCols = getCols("#", "Name", "Pos", "Age", "Team", "Ovr");

	return (
		<>
			<div className="row">
				{awardCandidates.map(({ name, players, stats }) => {
					const mip = name === "Most Improved Player";

					const cols = [
						...globalCols,
						...getCols(...stats.map(stat => `stat:${stat}`)),
					];

					let superCols;
					if (mip) {
						cols.push(...cols.slice(-5));
						superCols = [
							{
								title: "",
								colspan: 5,
							},
							{
								title: "This Season",
								colspan: 1 + stats.length,
							},
							{
								title: "Last Season",
								colspan: 1 + stats.length,
							},
						];
					}

					const rows = players.map((p, j) => {
						let ps: any;
						for (let i = p.stats.length - 1; i >= 0; i--) {
							if (p.stats[i].season === season && !p.stats[i].playoffs) {
								ps = p.stats[i];
								break;
							}
						}
						let pr;
						for (let i = p.ratings.length - 1; i >= 0; i--) {
							if (p.ratings[i].season === season) {
								pr = p.ratings[i];
								break;
							}
						}
						console.log(p, ps, pr);

						const pos = pr ? pr.pos : "?";
						const abbrev = ps ? ps.abbrev : undefined;
						const tid = ps ? ps.tid : undefined;

						const statsRow = stats.map(stat =>
							ps ? helpers.roundStat(ps[stat], stat) : undefined,
						);

						const data = [
							j + 1,
							<PlayerNameLabels
								injury={p.injury}
								pid={p.pid}
								skills={pr ? pr.skills : []}
								watch={p.watch}
							>
								{p.name}
							</PlayerNameLabels>,
							pos,
							p.age,
							<a href={helpers.leagueUrl(["roster", abbrev, season])}>
								{abbrev}
							</a>,
							pr ? pr.ovr : undefined,
							...statsRow,
						];

						if (mip) {
							let ps2: any;
							for (let i = p.stats.length - 1; i >= 0; i--) {
								if (p.stats[i].season === season - 1 && !p.stats[i].playoffs) {
									ps2 = p.stats[i];
									break;
								}
							}
							let pr2;
							for (let i = p.ratings.length - 1; i >= 0; i--) {
								if (p.ratings[i].season === season - 1) {
									pr2 = p.ratings[i];
									break;
								}
							}

							const statsRow2 = stats.map(stat =>
								ps2 ? helpers.roundStat(ps2[stat], stat) : undefined,
							);

							data.push(pr2 ? pr2.ovr : undefined);
							data.push(...statsRow2);
						}

						return {
							key: p.pid,
							data,
							classNames: {
								"table-danger": p.hof,
								"table-info": tid === userTid,
							},
						};
					});

					return (
						<div
							key={name}
							className={mip ? "col-12 col-md-9" : "col-12 col-md-6"}
						>
							<h2>{name}</h2>
							<DataTable
								cols={cols}
								defaultSort={[0, "asc"]}
								name={`AwardRaces${name}`}
								rows={rows}
								superCols={superCols}
							/>
						</div>
					);
				})}
			</div>
		</>
	);
};

AwardRaces.propTypes = {
	awardCandidates: PropTypes.arrayOf(PropTypes.object).isRequired,
	season: PropTypes.number.isRequired,
	userTid: PropTypes.number.isRequired,
};

export default AwardRaces;

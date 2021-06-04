import { useState } from "react";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { helpers } from "../util";
import classNames from "classnames";
import { NewsBlock } from "../components";
import { categories, types } from "../../common/transactionInfo";

const News = ({
	abbrev,
	events,
	level,
	order,
	season,
	teams,
	userTid,
}: View<"news">) => {
	const [showCategories, setShowCategories] = useState<
		Record<keyof typeof categories, boolean>
	>({
		award: true,
		draft: true,
		injury: true,
		league: true,
		playerFeat: true,
		playoffs: true,
		rare: true,
		transaction: true,
		team: true,
	});

	useTitleBar({
		title: "News Feed",
		dropdownView: "news",
		dropdownFields: {
			teamsAndAll: abbrev,
			seasons: season,
			newsLevels: level,
			newestOldestFirst: order,
		},
	});

	return (
		<>
			<div className="mt-1" style={{ marginLeft: "-0.5rem" }}>
				{helpers.keys(categories).map(category => {
					const info = categories[category];
					return (
						<div
							key={category}
							className={classNames(
								"form-check form-check-inline mb-2 ml-2",
								{},
							)}
						>
							<input
								className="form-check-input"
								type="checkbox"
								checked={showCategories[category]}
								id={`news-${category}`}
								onChange={() => {
									setShowCategories(show => ({
										...show,
										[category]: !show[category],
									}));
								}}
							/>
							<label
								className={`form-check-label badge badge-news ${info.className}`}
								htmlFor={`news-${category}`}
							>
								{info.text}
							</label>
						</div>
					);
				})}
			</div>

			<div className="mb-3">
				<button
					className="btn btn-link p-0"
					onClick={event => {
						event.preventDefault();
						const show = { ...showCategories };
						for (const key of helpers.keys(show)) {
							show[key] = true;
						}
						setShowCategories(show);
					}}
				>
					All
				</button>{" "}
				|{" "}
				<button
					className="btn btn-link p-0"
					onClick={event => {
						event.preventDefault();
						const show = { ...showCategories };
						for (const key of helpers.keys(show)) {
							show[key] = false;
						}
						setShowCategories(show);
					}}
				>
					None
				</button>
			</div>

			<div className="row">
				{events
					.filter(event => {
						const type = types[event.type];
						if (type) {
							return showCategories[type.category] === true;
						}
						return true;
					})
					.map(event => {
						return (
							<div
								key={event.eid}
								className="col-lg-3 col-md-4 col-sm-6 col-12 mb-3"
							>
								<NewsBlock
									event={event}
									season={season}
									teams={teams}
									userTid={userTid}
								/>
							</div>
						);
					})}
			</div>
		</>
	);
};

export default News;

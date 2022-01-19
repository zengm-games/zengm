import classNames from "classnames";
import { groupBy } from "../../common/groupBy";
import { Fragment } from "react";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, useLocal } from "../util";
import type { View } from "../../common/types";
import { GAME_ACRONYM, GAME_NAME } from "../../common";
import { DataTable } from "../components";

const DIFFICULTIES = ["normal", "hard", "insane"] as const;
const DIFFICULTIES_REVERSE = [...DIFFICULTIES].reverse();

const CompletionTable = ({ achievements }: View<"achievements">) => {
	const filtered = achievements.filter(
		achievement => achievement.category !== "Meta",
	);

	const levels = DIFFICULTIES.map((difficulty, i) => {
		// "insane" and "hard" also count towards "normal". "insane" also counts towards "hard".
		const allowed = DIFFICULTIES.slice(i);
		const count = filtered.filter(achievement =>
			allowed.some(difficulty => achievement[difficulty] > 0),
		).length;
		return {
			difficulty: helpers.upperCaseFirstLetter(difficulty),
			count,
			percent: count / filtered.length,
		};
	});

	return (
		<>
			<h2 className="mt-4">Completion Status</h2>
			<p className="text-muted text-small">(Ignoring the Meta achievements)</p>
			<table className="table table-nonfluid">
				<tbody>
					{levels.map(level => (
						<tr key={level.difficulty}>
							<th>{level.difficulty}</th>
							<td>
								{level.count}/{filtered.length}
							</td>
							<td>{Math.round(level.percent * 100)}%</td>
						</tr>
					))}
				</tbody>
			</table>
		</>
	);
};

const achievementClassNames = (
	achievement: {
		total: number;
		normal: number;
		hard: number;
		insane: number;
	} & {
		total: number;
	},
	difficultyRequired?: typeof DIFFICULTIES[number],
) => {
	return {
		"list-group-item-light":
			achievement.total === 0 ||
			(difficultyRequired === "hard" &&
				achievement.hard === 0 &&
				achievement.insane === 0) ||
			(difficultyRequired === "insane" && achievement.insane === 0),
		"list-group-item-secondary":
			achievement.normal > 0 &&
			achievement.hard === 0 &&
			achievement.insane === 0 &&
			difficultyRequired !== "hard" &&
			difficultyRequired !== "insane",
		"list-group-item-warning":
			achievement.hard > 0 &&
			achievement.insane === 0 &&
			difficultyRequired !== "insane",
		"list-group-item-success": achievement.insane > 0,
	};
};

const Category = ({
	achievements,
	category,
}: View<"achievements"> & {
	category: string;
}) => {
	const difficulties =
		category === "Meta"
			? (["normal"] as typeof DIFFICULTIES_REVERSE)
			: DIFFICULTIES_REVERSE;

	const achievementsWithTotal = achievements.map(achievement => ({
		...achievement,
		total: difficulties.reduce(
			(sum, difficulty) => sum + achievement[difficulty],
			0,
		),
	}));

	if (category === "Rebuilds") {
		const superCols = [
			{
				title: "",
				colspan: 1,
			},
			{
				title: "Level 1",
				colspan: 3,
			},
			{
				title: "Level 2",
				colspan: 3,
			},
		];

		const cols = getCols(
			["Team", "Normal", "Hard", "Insane", "Normal", "Hard", "Insane"],
			{
				Normal: {
					width: "55px",
				},
				Hard: {
					width: "55px",
				},
				Insane: {
					width: "55px",
				},
			},
		);

		// Get all the same team/season grouped together
		const achievementsGrouped = groupBy(achievementsWithTotal, achievement =>
			achievement.slug.split("_").slice(0, 3).join("_"),
		);
		const rows = Object.values(achievementsGrouped).map(achievements => {
			// Minimum color of the achievements in this row, to highlight the name which represents them all
			const fakeCounts = {
				total: Math.min(...achievements.map(achievement => achievement.total)),
				normal: 0,
				hard: 0,
				insane: 0,
			};
			const maxDifficulties = achievements.map(achievement => {
				let index = -1; // -1 means no achievements at any difficulty level
				for (let i = 0; i < DIFFICULTIES.length; i++) {
					const difficulty = DIFFICULTIES[i];
					if (achievement[difficulty] > 0) {
						index = i;
					}
				}
				return index;
			});
			const minDifficulty = Math.min(...maxDifficulties);
			if (minDifficulty >= 0) {
				fakeCounts[DIFFICULTIES[minDifficulty]] = 1;
			}
			const rowClassNames = {
				...achievementClassNames(fakeCounts),
				"d-flex": true,
			};

			return {
				key: achievements[0].slug,
				data: [
					{
						value: (
							<>
								{achievements[0].name}

								<a
									className="btn btn-xs btn-secondary ms-auto"
									href={`/new_league/real#rebuild=${achievements[0].slug}`}
									role="button"
								>
									New league
								</a>
							</>
						),
						sortValue: achievements[0].name,
						searchValue: achievements[0].name,
						classNames: rowClassNames,
					},
					...achievements
						.map(achievement => {
							return [
								{
									value: achievement.normal,
									classNames: {
										...achievementClassNames(achievement),
										"text-center": true,
									},
								},
								{
									value: achievement.hard,
									classNames: {
										...achievementClassNames(achievement, "hard"),
										"text-center": true,
									},
								},
								{
									value: achievement.insane,
									classNames: {
										...achievementClassNames(achievement, "insane"),
										"text-center": true,
									},
								},
							];
						})
						.flat(),
				],
			};
		});

		return (
			<>
				<p>
					Earn rebuild achievements by starting a real players league in a
					challenging historical situation.
				</p>
				<ul className="list-unstyled">
					<li>Level 1: win a championship in your first 3 seasons.</li>
					<li>
						Level 2: earn a Dynasty achievement within your first 12 seasons.
					</li>
				</ul>
				<div
					style={{
						maxWidth: 550,
					}}
				>
					<DataTable
						cols={cols}
						defaultSort={[0, "desc"]}
						name={"rebuilds"}
						rows={rows}
						superCols={superCols}
						striped={false}
						clickable={false} // Clicking messes up achievement highlighting
					/>
				</div>
			</>
		);
	}

	return (
		<div className="row g-2">
			{achievementsWithTotal.map(achievement => {
				return (
					<div key={achievement.slug} className="col-sm-6 col-md-4 col-xl-3">
						<div
							className={classNames("card", achievementClassNames(achievement))}
							key={achievement.slug}
							style={{
								minHeight: 109,
							}}
						>
							<div className="card-body">
								<h4 className="card-title">
									{achievement.name}
									{achievement.total > 0
										? difficulties.map(difficulty => {
												const count = achievement[difficulty];
												return (
													<span
														key={difficulty}
														className={`badge rounded-pill ${
															count > 0 ? "bg-dark" : "bg-secondary"
														} float-end ms-1`}
														title={`${helpers.upperCaseFirstLetter(
															difficulty,
														)} difficulty`}
													>
														{count}
													</span>
												);
										  })
										: null}
								</h4>
								<p className="card-text">{achievement.desc}</p>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};

const Achievements = ({ achievements }: View<"achievements">) => {
	useTitleBar({
		title: "Achievements",
	});
	const username = useLocal(state => state.username);
	const loggedIn = !!username;

	return (
		<>
			{!loggedIn ? (
				<div className="alert alert-warning d-inline-block">
					<p>
						<b>You are not logged in!</b> It's okay, you can still earn
						achievements when you are not logged in. They will just be stored in
						your browser profile, rather than in your {GAME_ACRONYM} account.
					</p>
					<p>
						If you do{" "}
						<a href="/account/login_or_register">log in to your account</a>, any
						achievements you earned while not logged in will be synced to your
						account.
					</p>
				</div>
			) : null}

			<p>
				You can earn achievements while playing in any {GAME_NAME} league, with
				two exceptions.
			</p>

			<p>
				Exception #1: If you ever enabled God Mode in a league, you will no
				longer receive achievements in that league.
			</p>

			<p>
				Exception #2: If you ever switched the difficulty level to "easy" (or
				below "normal" by any amount), you will no longer receive achievements
				in that league.
			</p>

			<p>
				Achievements can be earned at three difficulty levels: normal, hard, and
				insane. The three numbers you see in the top right of achievements you
				earned are the number of times you got each achievement at each of those
				levels.
			</p>

			<p>
				If you switch a league's difficulty level, you will get achievements at
				the lowest level used in that league.
			</p>

			<CompletionTable achievements={achievements} />

			{Object.entries(groupBy(achievements, "category")).map(
				([category, catAchievements], i) => {
					return (
						<Fragment key={category}>
							<h2 className={i > 0 ? "mt-4" : undefined}>{category}</h2>
							<Category achievements={catAchievements} category={category} />
						</Fragment>
					);
				},
			)}
		</>
	);
};

export default Achievements;

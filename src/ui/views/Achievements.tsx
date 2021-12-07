import classNames from "classnames";
import { groupBy } from "../../common/groupBy";
import { Fragment } from "react";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, useLocal } from "../util";
import type { View } from "../../common/types";
import { GAME_ACRONYM, GAME_NAME } from "../../common";

const difficulties = ["normal", "hard", "insane"] as const;
const difficultiesReverse = [...difficulties].reverse();

const CompletionTable = ({ achievements }: View<"achievements">) => {
	const filtered = achievements.filter(
		achievement => achievement.category !== "Meta",
	);

	const levels = difficulties.map((difficulty, i) => {
		// "insane" and "hard" also count towards "normal". "insane" also counts towards "hard".
		const allowed = difficulties.slice(i);
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
				Achievement can be earned at three difficulty levels: normal, hard, and
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
				([category, catAchivements], i) => {
					const catDifficulties =
						category === "Meta"
							? (["normal"] as unknown as typeof difficultiesReverse)
							: difficultiesReverse;

					return (
						<Fragment key={category}>
							<h2 className={i > 0 ? "mt-4" : undefined}>{category}</h2>
							<div
								className="row gx-2 gy-2"
								style={{
									marginBottom: "-0.5rem",
								}}
							>
								{catAchivements.map(achievement => {
									const total = catDifficulties.reduce(
										(sum, difficulty) => sum + achievement[difficulty],
										0,
									);

									return (
										<div
											key={achievement.slug}
											className="col-sm-6 col-md-4 col-xl-3"
										>
											<div
												className={classNames("card", {
													"list-group-item-light": total === 0,
													"list-group-item-secondary":
														achievement.normal > 0 &&
														achievement.hard === 0 &&
														achievement.insane === 0,
													"list-group-item-warning":
														achievement.hard > 0 && achievement.insane === 0,
													"list-group-item-success": achievement.insane > 0,
												})}
												key={achievement.slug}
												style={{
													minHeight: 109,
												}}
											>
												<div className="card-body">
													<h4 className="card-title">
														{achievement.name}
														{total > 0
															? catDifficulties.map(difficulty => {
																	const count = achievement[difficulty];
																	return (
																		<span
																			key={difficulty}
																			className={`badge badge-pill ${
																				count > 0
																					? "badge-dark"
																					: "badge-secondary"
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
						</Fragment>
					);
				},
			)}
		</>
	);
};

export default Achievements;

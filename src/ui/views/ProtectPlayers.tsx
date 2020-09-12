import React, { useState, FormEvent } from "react";
import useTitleBar from "../hooks/useTitleBar";
import {
	confirm,
	helpers,
	toWorker,
	logEvent,
	realtimeUpdate,
	getCols,
} from "../util";
import type { View } from "../../common/types";
import { PlayerNameLabels, SafeHtml, DataTable } from "../components";
import { PHASE } from "../../common";

const PlayerList = ({
	challengeNoRatings,
	updateProtectedPids,
	numProtectedPlayers,
	players,
	protectedPids,
	stats,
	tid,
	upcomingFreeAgentsText,
}: Pick<View<"protectPlayers">, "challengeNoRatings" | "players" | "stats"> & {
	updateProtectedPids: (newProtectedPids: number[]) => void;
	numProtectedPlayers: number;
	protectedPids: number[];
	tid: number;
	upcomingFreeAgentsText: React.ReactNode;
}) => {
	const cols = getCols(
		"",
		"Name",
		"Pos",
		"Age",
		"Ovr",
		"Pot",
		"Contract",
		"Exp",
		...stats.map(stat => `stat:${stat}`),
		"Acquired",
	);

	const numRemaining = numProtectedPlayers - protectedPids.length;

	const rows = players.map(p => {
		return {
			key: p.pid,
			data: [
				<input
					type="checkbox"
					title={p.untradableMsg}
					checked={protectedPids.includes(p.pid)}
					disabled={numRemaining <= 0 && !protectedPids.includes(p.pid)}
					onChange={() => {
						if (!protectedPids.includes(p.pid)) {
							updateProtectedPids([...protectedPids, p.pid]);
						} else {
							updateProtectedPids(protectedPids.filter(pid => pid !== p.pid));
						}
					}}
				/>,
				<PlayerNameLabels
					pid={p.pid}
					injury={p.injury}
					jerseyNumber={p.jerseyNumber}
					skills={p.ratings.skills}
					watch={p.watch}
				>
					{p.name}
				</PlayerNameLabels>,
				p.ratings.pos,
				p.age,
				!challengeNoRatings ? p.ratings.ovr : null,
				!challengeNoRatings ? p.ratings.pot : null,
				helpers.formatCurrency(p.contract.amount, "M"),
				p.contract.exp,
				...stats.map(stat => helpers.roundStat(p.stats[stat], stat)),
				{
					value: <SafeHtml dirty={p.latestTransaction} />,
					searchValue: p.latestTransaction,
					sortValue: p.latestTransactionSeason,
				},
			],
			classNames: {
				"table-success": protectedPids.includes(p.pid),
			},
		};
	});

	return (
		<>
			<p>
				Check the box to the left of a player to protect him. Any players who
				are not protected may be selected in the expansion draft.
			</p>
			{upcomingFreeAgentsText}
			<p>Protections remaining: {numRemaining}</p>
			<div className="btn-group mb-3">
				<button
					type="button"
					className="btn btn-light-bordered"
					onClick={async () => {
						await toWorker("main", "autoProtect", tid);
					}}
				>
					Auto Select
				</button>
				<button
					type="button"
					className="btn btn-light-bordered"
					onClick={() => {
						updateProtectedPids([]);
					}}
				>
					Clear
				</button>
			</div>
			<div>
				<DataTable
					cols={cols}
					defaultSort={[5, "desc"]}
					name="ProtectPlayers"
					rows={rows}
					hideAllControls
					nonfluid
				/>
			</div>
		</>
	);
};

const ProtectPlayers = ({
	challengeNoRatings,
	expansionDraft,
	expansionTeam,
	nextPhase,
	spectator,
	players,
	stats,
	userTid,
	userTids,
}: View<"protectPlayers">) => {
	const [saving, setSaving] = useState(false);

	useTitleBar({ title: "Protect Players" });

	const protectedPids = expansionDraft.protectedPids[userTid] || [];

	const numRemaining =
		expansionDraft.numProtectedPlayers - protectedPids.length;

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();

		if (saving) {
			return;
		}

		setSaving(true);

		if (
			numRemaining > 0 &&
			protectedPids.length < players.length &&
			!spectator
		) {
			const result = await confirm(
				"Are you sure you want start the expansion draft without using all your protections?",
				{
					okText: "Yes",
					cancelText: "No",
				},
			);

			if (!result) {
				setSaving(false);
				return;
			}
		} else if (userTids.length > 1) {
			// Check other teams in multi team mode too
			for (const tid of userTids) {
				const protectedPids2 = expansionDraft.protectedPids[tid] || [];
				const numRemaining2 =
					expansionDraft.numProtectedPlayers - protectedPids2.length;
				if (numRemaining2 > 0) {
					const result = await confirm(
						"Are you sure you want start the expansion draft without using all your protections for all of the teams you control with multi team mode?",
						{
							okText: "Yes",
							cancelText: "No",
						},
					);

					if (!result) {
						setSaving(false);
						return;
					}
					break;
				}
			}
		}

		const errors = await toWorker("main", "startExpansionDraft");

		if (errors) {
			logEvent({
				type: "error",
				text: `- ${errors.join("<br>- ")}`,
				saveToDb: false,
			});
			setSaving(false);
		} else {
			realtimeUpdate([], helpers.leagueUrl(["draft"]));
		}
	};

	const updateProtectedPids = async (newProtectedPids: number[]) => {
		await toWorker("main", "updateProtectedPlayers", userTid, newProtectedPids);
	};

	const handleCancel = async () => {
		await toWorker("main", "cancelExpansionDraft");
		realtimeUpdate([], helpers.leagueUrl([]));
	};

	const upcomingFreeAgentsText =
		nextPhase !== undefined && nextPhase > PHASE.PLAYOFFS ? (
			<p>
				<span className="text-warning">
					Upcoming free agents are available to be protected or drafted.
				</span>{" "}
				If drafted, they will never refuse to re-sign with their expansion team.
			</p>
		) : null;

	return (
		<>
			<form onSubmit={handleSubmit}>
				{expansionTeam ? (
					<>
						<p>
							Your team is an expansion team, so you have no players to protect.
						</p>
						{upcomingFreeAgentsText}
					</>
				) : expansionDraft.numProtectedPlayers <= 0 ? (
					<>
						<p>There are no protected players in this expansion draft.</p>
						{upcomingFreeAgentsText}
					</>
				) : spectator ? (
					<p>The AI will handle protecting players in spectator mode.</p>
				) : (
					<PlayerList
						challengeNoRatings={challengeNoRatings}
						updateProtectedPids={updateProtectedPids}
						numProtectedPlayers={expansionDraft.numProtectedPlayers}
						players={players}
						protectedPids={protectedPids}
						stats={stats}
						tid={userTid}
						upcomingFreeAgentsText={upcomingFreeAgentsText}
					/>
				)}

				<button
					type="submit"
					className="btn btn-primary"
					disabled={numRemaining < 0 || saving}
				>
					Start Expansion Draft
				</button>

				<button
					type="button"
					className="btn btn-light-bordered ml-2"
					disabled={saving}
					onClick={handleCancel}
				>
					Cancel Expansion Draft
				</button>
			</form>
		</>
	);
};

export default ProtectPlayers;

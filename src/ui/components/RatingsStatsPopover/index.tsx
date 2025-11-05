import clsx from "clsx";
import { type Ref, useCallback, useEffect, useState } from "react";
import RatingsStats from "./RatingsStats.tsx";
import WatchBlock from "../WatchBlock.tsx";
import { helpers, toWorker } from "../../util/index.ts";
import ResponsivePopover from "../ResponsivePopover.tsx";
import { PLAYER } from "../../../common/index.ts";
import { crossTabEmitter } from "../../util/crossTabEmitter.ts";

const PlayerNote = ({
	className,
	note,
}: {
	className?: string;
	note: string;
}) => {
	return (
		<>
			<div
				className={clsx("text-wrap", className)}
				style={{
					maxHeight: "7em",
					overflowY: "auto",
				}}
			>
				{note}
			</div>
		</>
	);
};

const Icon = ({
	onClick,
	ref,
	watch,
}: {
	onClick?: () => void;
	ref?: Ref<HTMLSpanElement>;
	watch: number;
}) => {
	return (
		<span
			ref={ref}
			className={clsx(
				"glyphicon glyphicon-stats watch",
				watch === 0 ? undefined : `watch-active-${watch}`,
			)}
			data-no-row-highlight="true"
			title="View ratings and stats"
			onClick={onClick}
		/>
	);
};

type Props = {
	disableNameLink?: boolean;
	pid: number;
	season?: number;
} & (
	| {
			// If initialWatch is passed, that is the initial value only and we need to keep track of local changes
			// If neither is passed, then we need to fetch the initial value ourselves too!
			initialWatch?: number;
			watch?: undefined;
	  }
	| {
			initialWatch?: undefined;
			watch?: number;
	  }
);

const RatingsStatsPopover = ({
	disableNameLink,
	initialWatch,
	pid,
	season,
	watch,
}: Props) => {
	const [loadingData, setLoadingData] = useState<boolean>(false);
	const [player, setPlayer] = useState<{
		abbrev?: string;
		tid?: number;
		age?: number;
		jerseyNumber?: string;
		name?: string;
		ratings?: {
			pos: string;
			ovr: number;
			pot: number;
			hgt: number;
			stre: number;
			spd: number;
			endu: number;
			season: number;
		};
		stats?: {
			[key: string]: number;
		};
		pid: number;
		type?: "career" | "current" | "draft" | number;
		note?: string;
	}>({
		pid,
	});

	// If watch is undefined, fetch it from worker
	const LOCAL_WATCH = watch === undefined;
	const [localWatch, setLocalWatch] = useState(initialWatch ?? 0);
	useEffect(() => {
		const updateLocalWatch = async () => {
			const newLocalWatch = await toWorker("main", "getPlayerWatch", pid);
			setLocalWatch(newLocalWatch);
		};

		if (LOCAL_WATCH) {
			if (initialWatch === undefined) {
				// Need to fetch initial value
				updateLocalWatch();
			}

			// Need to listen for bulk action updates
			const unbind = crossTabEmitter.on("updateWatch", async (pids) => {
				if (pids.includes(pid)) {
					await updateLocalWatch();
				}
			});
			return unbind;
		}

		run();
	}, [initialWatch, LOCAL_WATCH, pid]);

	const actualWatch = watch ?? localWatch;

	// Object.is to handle NaN
	if (!Object.is(player.pid, pid)) {
		setLoadingData(false);
		setPlayer({
			pid,
		});
	}

	const loadData = useCallback(async () => {
		const p = await toWorker("main", "ratingsStatsPopoverInfo", {
			pid,
			season,
		});
		setPlayer({
			abbrev: p.abbrev,
			tid: p.tid,
			age: p.age,
			jerseyNumber: p.jerseyNumber,
			name: p.name,
			ratings: p.ratings,
			stats: p.stats,
			pid,
			type: p.type,
			note: p.note,
		});
		setLoadingData(false);
	}, [pid, season]);

	const toggle = useCallback(() => {
		if (!loadingData) {
			loadData();
			setLoadingData(true);
		}
	}, [loadData, loadingData]);

	const { abbrev, tid, age, jerseyNumber, name, ratings, stats, type, note } =
		player;

	// JTODO: this probably makes a bit more sense as a component instead of a pure jsx function?
	let nameBlock = null;
	if (name) {
		nameBlock = (
			<div className="d-flex">
				{jerseyNumber ? (
					<div className="text-body-secondary jersey-number-popover align-self-end me-1">
						{jerseyNumber}
					</div>
				) : null}
				{disableNameLink ? (
					<b>{name}</b>
				) : (
					<a
						href={helpers.leagueUrl(["player", pid])}
						className="fw-bold text-truncate"
					>
						{name}
					</a>
				)}
				{ratings !== undefined ? (
					<div className="ms-1">{ratings.pos}</div>
				) : null}
				{abbrev !== undefined && tid !== undefined && tid !== PLAYER.RETIRED ? (
					<a
						href={helpers.leagueUrl([
							"roster",
							`${abbrev}_${tid}`,
							ratings ? ratings.season : undefined,
						])}
						className="ms-1"
					>
						{abbrev}
					</a>
				) : null}
				{age !== undefined ? (
					<div className="ms-1 flex-shrink-0">{age} yo</div>
				) : null}
				<WatchBlock
					pid={pid}
					watch={actualWatch}
					onChange={
						LOCAL_WATCH
							? (newWatch) => {
									setLocalWatch(newWatch);
								}
							: undefined
					}
				/>
			</div>
		);
	}

	const id = `ratings-stats-popover-${player.pid}`;

	const modalHeader = nameBlock;
	const modalBody = (
		<>
			<RatingsStats ratings={ratings} stats={stats} type={type} />
			{note ? <PlayerNote className="mt-2" note={note} /> : null}
		</>
	);

	const popoverContent = (
		<div
			className="text-nowrap"
			style={{
				minWidth: 250,
			}}
		>
			<div className="mb-2">{nameBlock}</div>
			<RatingsStats ratings={ratings} stats={stats} type={type} />
			{note ? <PlayerNote className="mt-2" note={note} /> : null}
		</div>
	);

	const renderTarget = ({
		forwardedRef,
		onClick,
	}: {
		forwardedRef?: Ref<HTMLSpanElement>;
		onClick?: () => void;
	}) => <Icon ref={forwardedRef} onClick={onClick} watch={actualWatch} />;

	return (
		<ResponsivePopover
			id={id}
			modalHeader={modalHeader}
			modalBody={modalBody}
			popoverContent={popoverContent}
			renderTarget={renderTarget}
			toggle={toggle}
		/>
	);
};

export default RatingsStatsPopover;

import classNames from "classnames";
import { forwardRef, RefObject, useCallback, useEffect, useState } from "react";
import RatingsStats from "./RatingsStats";
import WatchBlock from "../WatchBlock";
import { helpers, toWorker } from "../../util";
import ResponsivePopover from "../ResponsivePopover";
import { PLAYER } from "../../../common";

const Icon = forwardRef<
	HTMLElement,
	{
		onClick?: () => void;
		watch?: boolean;
	}
>(({ onClick, watch }, ref) => {
	return (
		<span
			ref={ref}
			className={classNames("glyphicon glyphicon-stats watch", {
				"watch-active": watch,
			})}
			data-no-row-highlight="true"
			title="View ratings and stats"
			onClick={onClick}
		/>
	);
});

type Props = {
	pid: number;
	season?: number;
	watch?: boolean;
};

const RatingsStatsPopover = ({ season, pid, watch }: Props) => {
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
	}>({
		pid,
	});

	// If watch is undefined, fetch it from worker
	const LOCAL_WATCH = watch === undefined;
	const [localWatch, setLocalWatch] = useState(false);
	useEffect(() => {
		const run = async () => {
			if (LOCAL_WATCH) {
				const newLocalWatch = await toWorker("main", "getPlayerWatch", pid);
				setLocalWatch(newLocalWatch);
			}
		};

		run();
	}, [LOCAL_WATCH, pid]);

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
		});
		setLoadingData(false);
	}, [pid, season]);

	const toggle = useCallback(() => {
		if (!loadingData) {
			loadData();
			setLoadingData(true);
		}
	}, [loadData, loadingData]);

	const { abbrev, tid, age, jerseyNumber, name, ratings, stats, type } = player;

	let nameBlock = null;
	if (name) {
		nameBlock = (
			<div className="d-flex">
				{jerseyNumber ? (
					<div className="text-muted jersey-number-popover align-self-end me-1">
						{jerseyNumber}
					</div>
				) : null}
				<a
					href={helpers.leagueUrl(["player", pid])}
					className="fw-bold text-truncate"
				>
					{name}
				</a>
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
							? newWatch => {
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
		<RatingsStats ratings={ratings} stats={stats} type={type} />
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
		</div>
	);

	const renderTarget = ({
		forwardedRef,
		onClick,
	}: {
		forwardedRef?: RefObject<HTMLElement>;
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

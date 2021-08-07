import classNames from "classnames";
import PropTypes from "prop-types";
import { useCallback, useState } from "react";
import RatingsStats from "./RatingsStats";
import WatchBlock from "../WatchBlock";
import { helpers, toWorker } from "../../util";
import ResponsivePopover from "../ResponsivePopover";
import { PLAYER } from "../../../common";

const Icon = ({
	onClick,
	watch,
}: {
	onClick?: () => void;
	watch?: boolean;
}) => {
	return (
		<span
			className={classNames("glyphicon glyphicon-stats watch", {
				"watch-active": watch === true, // Explicit true check is for Firefox 57 and older
			})}
			data-no-row-highlight="true"
			title="View ratings and stats"
			onClick={onClick}
		/>
	);
};

type Props = {
	// For cases when we want to display the watch status, but not make it toggleable because the data will not reload, like for live box scores
	disableWatchToggle?: boolean;
	pid: number;
	season?: number;
	watch?: boolean;
};

const RatingsStatsPopover = ({
	disableWatchToggle,
	season,
	pid,
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
	}>({
		pid,
	});

	// Object.is to handle NaN
	if (!Object.is(player.pid, pid)) {
		setLoadingData(false);
		setPlayer({
			pid,
		});
	}

	const loadData = useCallback(async () => {
		const p = await toWorker("main", "ratingsStatsPopoverInfo", pid, season);
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
		// Explicit boolean check is for Firefox 57 and older
		nameBlock = (
			<div className="d-flex">
				{jerseyNumber ? (
					<div className="text-muted jersey-number-popover align-self-end mr-1">
						{jerseyNumber}
					</div>
				) : null}
				<a
					href={helpers.leagueUrl(["player", pid])}
					className="font-weight-bold text-truncate"
				>
					{name}
				</a>
				{ratings !== undefined ? (
					<div className="ml-1">{ratings.pos}</div>
				) : null}
				{abbrev !== undefined && tid !== undefined && tid !== PLAYER.RETIRED ? (
					<a
						href={helpers.leagueUrl([
							"roster",
							`${abbrev}_${tid}`,
							ratings ? ratings.season : undefined,
						])}
						className="ml-1"
					>
						{abbrev}
					</a>
				) : null}
				{age !== undefined ? (
					<div className="ml-1 flex-shrink-0">{age} yo</div>
				) : null}
				{!disableWatchToggle && typeof watch === "boolean" ? (
					<WatchBlock pid={pid} watch={watch} />
				) : null}
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

	const renderTarget = ({ onClick }: { onClick?: () => void }) => (
		<Icon onClick={onClick} watch={watch} />
	);

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

RatingsStatsPopover.propTypes = {
	pid: PropTypes.number.isRequired,
	watch: PropTypes.bool,
};

export default RatingsStatsPopover;

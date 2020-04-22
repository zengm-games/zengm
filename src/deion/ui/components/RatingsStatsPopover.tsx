import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useCallback, useState } from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";
import WatchBlock from "./WatchBlock";
import { helpers, overrides, toWorker } from "../util";

type Props = {
	pid: number;
	watch?: boolean;
};

const RatingsStatsPopover = ({ pid, watch }: Props) => {
	const [loadDataStarted, setLoadDataStarted] = useState<boolean>(false);
	const [player, setPlayer] = useState<{
		name?: string;
		ratings?: {
			pos: string;
			ovr: number;
			pot: number;
			hgt: number;
			stre: number;
			spd: number;
			endu: number;
		};
		stats?: {
			[key: string]: number;
		};
		pid: number;
	}>({
		pid,
	});

	// Object.is to handle NaN
	if (!Object.is(player.pid, pid)) {
		setLoadDataStarted(false);
		setPlayer({
			pid,
		});
	}

	const loadData = useCallback(async () => {
		const p = await toWorker("main", "ratingsStatsPopoverInfo", pid);
		setPlayer({
			name: p.name,
			ratings: p.ratings,
			stats: p.stats,
			pid,
		});
	}, [pid]);
	const toggle = useCallback(() => {
		if (!loadDataStarted) {
			loadData();
		}

		setLoadDataStarted(true);
	}, [loadData, loadDataStarted]);
	const { name, ratings, stats } = player;
	let nameBlock;

	if (name) {
		// Explicit boolean check is for Firefox 57 and older
		nameBlock = (
			<p className="mb-2">
				<a href={helpers.leagueUrl(["player", pid])}>
					<b>{name}</b>
				</a>
				{ratings !== undefined ? `, ${ratings.pos}` : null}
				{typeof watch === "boolean" ? (
					<WatchBlock pid={pid} watch={watch} />
				) : null}
			</p>
		);
	} else {
		nameBlock = <p className="mb-2" />;
	}

	const popover = (
		<Popover id={`ratings-stats-popover-${player.pid}`}>
			<Popover.Content>
				<div
					className="text-nowrap"
					style={{
						minWidth: 250,
						minHeight: 225,
					}}
				>
					{nameBlock}
					<overrides.components.RatingsStats ratings={ratings} stats={stats} />
				</div>
			</Popover.Content>
		</Popover>
	);

	return (
		<OverlayTrigger
			trigger="click"
			placement="right"
			overlay={popover}
			rootClose
			onEnter={toggle}
		>
			<span
				className={classNames("glyphicon glyphicon-stats watch", {
					"watch-active": watch === true, // Explicit true check is for Firefox 57 and older
				})}
				data-no-row-highlight="true"
				title="View ratings and stats"
			/>
		</OverlayTrigger>
	);
};

RatingsStatsPopover.propTypes = {
	pid: PropTypes.number.isRequired,
	watch: PropTypes.bool,
};

export default RatingsStatsPopover;

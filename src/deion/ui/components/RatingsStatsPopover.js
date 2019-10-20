// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useCallback, useRef, useState } from "react";
import Popover from "reactstrap/lib/Popover";
import PopoverBody from "reactstrap/lib/PopoverBody";
import WatchBlock from "./WatchBlock";
import { helpers, overrides, toWorker } from "../util";

type Props = {
	pid: number,
	watch?: boolean,
};

let count = 0;

const RatingsStatsPopover = ({ pid, watch }: Props) => {
	const [open, setOpen] = useState<boolean>(false);
	const [loadDataStarted, setLoadDataStarted] = useState<boolean>(false);
	const [player, setPlayer] = useState<{
		name?: string,
		ratings?: {
			pos: string,
			ovr: number,
			pot: number,
			hgt: number,
			stre: number,
			spd: number,
			endu: number,
			[key: string]: number,
		},
		stats?: {
			[key: string]: number,
		},
		pid: number,
	}>({
		pid,
	});

	const countLocal = useRef(count);
	count += 1;

	if (player.pid !== pid) {
		setLoadDataStarted(false);
		setPlayer({ pid });
	}

	const loadData = useCallback(async () => {
		const p = await toWorker("ratingsStatsPopoverInfo", pid);

		setPlayer({
			name: p.name,
			ratings: p.ratings,
			stats: p.stats,
			pid,
		});
	}, [pid]);

	const toggle = useCallback(() => {
		if (!open && !loadDataStarted) {
			loadData();
		}

		setLoadDataStarted(true);
		setOpen(!open);
	}, [loadData, loadDataStarted, open]);

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

	return (
		<>
			<span
				className={classNames("glyphicon glyphicon-stats watch", {
					"watch-active": watch === true, // Explicit true check is for Firefox 57 and older
				})}
				id={`ratings-pop-${countLocal.current}`}
				onClick={toggle}
				data-no-row-highlight="true"
				title="View ratings and stats"
			/>
			<Popover
				placement="right"
				isOpen={open}
				target={`ratings-pop-${countLocal.current}`}
				toggle={toggle}
				trigger="legacy"
			>
				<PopoverBody>
					<div
						className="text-nowrap"
						style={{
							minWidth: 250,
							minHeight: 225,
						}}
					>
						{nameBlock}
						<overrides.components.RatingsStats
							ratings={ratings}
							stats={stats}
						/>
					</div>
				</PopoverBody>
			</Popover>
		</>
	);
};

RatingsStatsPopover.propTypes = {
	pid: PropTypes.number.isRequired,
	watch: PropTypes.bool,
};

export default RatingsStatsPopover;

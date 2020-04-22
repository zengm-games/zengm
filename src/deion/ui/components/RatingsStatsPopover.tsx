import classNames from "classnames";
import PropTypes from "prop-types";
import React, { MouseEvent, useCallback, useState } from "react";
import { Modal, OverlayTrigger, Popover } from "react-bootstrap";
import WatchBlock from "./WatchBlock";
import { helpers, overrides, toWorker } from "../util";

const Icon = ({
	onClick,
	watch,
}: {
	onClick?: (e: MouseEvent) => void;
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

	let nameBlock = null;
	if (name) {
		// Explicit boolean check is for Firefox 57 and older
		nameBlock = (
			<>
				<a href={helpers.leagueUrl(["player", pid])}>
					<b>{name}</b>
				</a>
				{ratings !== undefined ? `, ${ratings.pos}` : null}
				{typeof watch === "boolean" ? (
					<WatchBlock pid={pid} watch={watch} />
				) : null}
			</>
		);
	}

	const mobile = window.screen && window.screen.width < 768;

	const [showModal, setShowModal] = useState(false);

	if (mobile) {
		return (
			<>
				<Icon
					watch={watch}
					onClick={() => {
						setShowModal(true);
						toggle();
					}}
				/>
				<Modal
					animation={false}
					centered
					show={showModal}
					onHide={() => {
						setShowModal(false);
					}}
				>
					<Modal.Header closeButton>{nameBlock}</Modal.Header>
					<Modal.Body>
						<overrides.components.RatingsStats
							ratings={ratings}
							stats={stats}
						/>
					</Modal.Body>
				</Modal>
			</>
		);
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
					<p className="mb-2">{nameBlock}</p>
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
			<Icon watch={watch} />
		</OverlayTrigger>
	);
};

RatingsStatsPopover.propTypes = {
	pid: PropTypes.number.isRequired,
	watch: PropTypes.bool,
};

export default RatingsStatsPopover;

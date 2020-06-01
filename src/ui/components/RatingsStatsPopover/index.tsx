import classNames from "classnames";
import PropTypes from "prop-types";
import React, { MouseEvent, useCallback, useEffect, useState } from "react";
import { Modal, OverlayTrigger, Popover } from "react-bootstrap";
import RatingsStats from "./RatingsStats";
import WatchBlock from "../WatchBlock";
import { helpers, toWorker } from "../../util";

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

const isMobile = () => window.screen && window.screen.width < 768;

type Props = {
	pid: number;
	watch?: boolean;
};

const RatingsStatsPopover = ({ pid, watch }: Props) => {
	const [loadingData, setLoadingData] = useState<boolean>(false);
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
		setLoadingData(false);
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
		setLoadingData(false);
	}, [pid]);

	const toggle = useCallback(() => {
		if (!loadingData) {
			loadData();
			setLoadingData(true);
		}
	}, [loadData, loadingData]);

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

	const [mobile, setMobile] = useState(isMobile);
	useEffect(() => {
		const update = () => {
			setMobile(isMobile());
		};
		window.addEventListener("optimizedResize", update);
		return () => {
			window.removeEventListener("optimizedResize", update);
		};
	}, []);

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
						<RatingsStats ratings={ratings} stats={stats} />
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
					<RatingsStats ratings={ratings} stats={stats} />
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

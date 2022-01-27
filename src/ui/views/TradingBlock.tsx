import PropTypes from "prop-types";
import { ReactNode, useRef, useState } from "react";
import { PHASE } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, toWorker } from "../util";
import { DataTable } from "../components";
import type { View } from "../../common/types";
import type api from "../../worker/api";
import getTemplate from "../util/columns/getTemplate";
import { TableConfig } from "../util/TableConfig";

type OfferType = Awaited<
	ReturnType<typeof api["main"]["getTradingBlockOffers"]>
>[0];

type OfferProps = {
	challengeNoRatings: boolean;
	handleClickNegotiate: (
		tid: number,
		otherPids: number[],
		otherDpids: number[],
	) => Promise<void>;
	i: number;
	config: TableConfig;
} & OfferType;

const Offer = (props: OfferProps) => {
	const {
		abbrev,
		dpids,
		handleClickNegotiate,
		i,
		lost,
		name,
		otl,
		payroll,
		picks,
		pids,
		players,
		region,
		config,
		strategy,
		tid,
		tied,
		warning,
		won,
	} = props;

	let offerPlayers: ReactNode = null;
	if (players.length > 0) {
		const cols = config.columns;

		const rows = players.map(p => {
			return {
				key: p.pid,
				data: Object.fromEntries(
					cols.map(col => [col.key, getTemplate(p, col, config)]),
				),
			};
		});

		offerPlayers = (
			<div className="col-md-8">
				<DataTable
					cols={cols}
					config={config}
					defaultSort={["Contract", "desc"]}
					hideAllControls
					name="TradingBlockOffer"
					rows={rows}
				/>
			</div>
		);
	}

	let offerPicks: ReactNode = null;
	if (picks.length > 0) {
		offerPicks = (
			<div className="col-md-4">
				<table className="table table-striped table-sm">
					<thead>
						<tr>
							<th>Draft Picks</th>
						</tr>
					</thead>
					<tbody>
						{picks.map(pick => (
							<tr key={pick.dpid}>
								<td>{pick.desc}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	}

	return (
		<div className="mt-4">
			<h2>
				Offer {i + 1}:{" "}
				<a href={helpers.leagueUrl(["roster", `${abbrev}_${tid}`])}>
					{region} {name}
				</a>
			</h2>
			<p>
				{won}-{lost}
				{otl > 0 ? <>-{otl}</> : null}
				{tied > 0 ? <>-{tied}</> : null}, {strategy},{" "}
				{helpers.formatCurrency(payroll / 1000, "M")} payroll
			</p>
			<div className="row">
				{offerPlayers}
				{offerPicks}
				{picks.length === 0 && players.length === 0 ? (
					<div className="col-12">Nothing.</div>
				) : null}
			</div>
			{warning ? <p className="text-danger">{warning}</p> : null}

			<button
				type="submit"
				className="btn btn-light-bordered mb-4"
				onClick={() => handleClickNegotiate(tid, pids, dpids)}
			>
				Negotiate
			</button>
		</div>
	);
};

Offer.propTypes = {
	abbrev: PropTypes.string.isRequired,
	dpids: PropTypes.arrayOf(PropTypes.number).isRequired,
	handleClickNegotiate: PropTypes.func.isRequired,
	i: PropTypes.number.isRequired,
	lost: PropTypes.number.isRequired,
	name: PropTypes.string.isRequired,
	payroll: PropTypes.number.isRequired,
	picks: PropTypes.arrayOf(PropTypes.object).isRequired,
	pids: PropTypes.arrayOf(PropTypes.number).isRequired,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	region: PropTypes.string.isRequired,
	config: PropTypes.object.isRequired,
	strategy: PropTypes.string.isRequired,
	tid: PropTypes.number.isRequired,
	tied: PropTypes.number,
	warning: PropTypes.string,
	won: PropTypes.number.isRequired,
};

const pickCols = getCols(["", "Draft Picks"], {
	"": {
		sortSequence: [],
	},
	"Draft Picks": {
		width: "100%",
	},
});

const TradingBlock = (props: View<"tradingBlock">) => {
	const [state, setState] = useState<{
		asking: boolean;
		offers: OfferType[];
		pids: number[];
		dpids: number[];
	}>({
		asking: false,
		offers: [],
		pids: props.initialPid !== undefined ? [props.initialPid] : [],
		dpids: [],
	});

	const beforeOffersRef = useRef<HTMLDivElement>(null);

	const handleChangeAsset = (type: "pids" | "dpids", id: number) => {
		setState(prevState => {
			const ids = {
				pids: helpers.deepCopy(prevState.pids),
				dpids: helpers.deepCopy(prevState.dpids),
			};

			if (ids[type].includes(id)) {
				ids[type] = ids[type].filter(currId => currId !== id);
			} else {
				ids[type].push(id);
			}

			return {
				...prevState,
				[type]: ids[type],
			};
		});
	};

	const handleClickAsk = async () => {
		setState(prevState => ({
			...prevState,
			asking: true,
			offers: [],
		}));

		const offers: OfferType[] = await toWorker(
			"main",
			"getTradingBlockOffers",
			{ pids: state.pids, dpids: state.dpids },
		);

		setState(prevState => ({
			...prevState,
			asking: false,
			offers,
		}));
	};

	const handleClickAskBottom = async () => {
		await handleClickAsk();

		if (beforeOffersRef.current) {
			// This actually scrolls to above the button, because I don't want to worry about the fixed header offset
			beforeOffersRef.current.scrollIntoView();
		}
	};

	const handleClickNegotiate = async (
		tid: number,
		otherPids: number[],
		otherDpids: number[],
	) => {
		await toWorker("actions", "tradeFor", {
			otherDpids,
			otherPids,
			tid,
			userDpids: state.dpids,
			userPids: state.pids,
		});
	};

	const {
		challengeNoRatings,
		challengeNoTrades,
		gameOver,
		spectator,
		phase,
		config: _config,
		userPicks,
		userRoster,
	} = props;

	useTitleBar({ title: "Trading Block" });

	if (spectator) {
		return <p>You're not allowed to make trades in spectator mode.</p>;
	}

	if (challengeNoTrades) {
		return (
			<div>
				<p className="alert alert-danger d-inline-block">
					<b>Challenge Mode:</b> You're not allowed to make trades.
				</p>
			</div>
		);
	}

	if (
		(phase >= PHASE.AFTER_TRADE_DEADLINE && phase <= PHASE.PLAYOFFS) ||
		phase === PHASE.FANTASY_DRAFT ||
		gameOver
	) {
		return (
			<div>
				<h2>Error</h2>
				<p>
					You're not allowed to make trades{" "}
					{phase === PHASE.AFTER_TRADE_DEADLINE
						? "after the trade deadline"
						: "now"}
					.
				</p>
			</div>
		);
	}

	const config = TableConfig.unserialize(_config);

	config.addColumn(
		{
			title: "",
			key: "include",
			sortSequence: [],
			noSearch: true,
			template: ({ p, c, vars }) => (
				<input
					type="checkbox"
					checked={state.pids.includes(p.pid)}
					disabled={p.untradable}
					onChange={() => handleChangeAsset("pids", p.pid)}
					title={p.untradableMsg}
				/>
			),
		},
		0,
	);

	const cols = [...config.columns];

	const rows = userRoster.map(p => {
		return {
			key: p.pid,
			data: Object.fromEntries(
				cols.map(col => [col.key, getTemplate(p, col, config)]),
			),
		};
	});

	const pickRows = userPicks.map((pick, i) => {
		return {
			key: pick.dpid,
			data: [
				<input
					type="checkbox"
					checked={state.dpids.includes(pick.dpid)}
					onChange={() => handleChangeAsset("dpids", pick.dpid)}
				/>,
				{
					value: pick.desc,
					sortValue: i,
				},
			],
		};
	});

	return (
		<>
			<p>
				Select some assets you want to trade away and other teams will make you
				trade offers.
			</p>

			<div className="row mb-3">
				<div className="col-md-9">
					<DataTable
						cols={cols}
						config={config}
						defaultSort={["Contract", "desc"]}
						name="TradingBlock"
						rows={rows}
					/>
				</div>
				<div className="col-md-3 pt-3">
					<DataTable
						cols={pickCols}
						hideAllControls
						name={`TradingBlock:Picks`}
						rows={pickRows}
					/>
				</div>
			</div>

			<div ref={beforeOffersRef} />

			<div className="text-center">
				<button
					className="btn btn-lg btn-primary"
					disabled={state.asking}
					onClick={handleClickAsk}
				>
					{!state.asking ? "Ask For Trade Proposals" : "Asking..."}
				</button>
			</div>

			{state.offers.map((offer, i) => {
				return (
					<Offer
						key={offer.tid}
						config={config}
						challengeNoRatings={challengeNoRatings}
						handleClickNegotiate={handleClickNegotiate}
						i={i}
						{...offer}
					/>
				);
			})}

			{state.offers.length > 0 ? (
				<div className="text-center">
					<p>Don't like those offers? Well maybe you'll get lucky if you...</p>
					<button
						className="btn btn-lg btn-primary"
						disabled={state.asking}
						onClick={handleClickAskBottom}
					>
						{!state.asking ? "Ask For Trade Proposals Again" : "Asking..."}
					</button>
				</div>
			) : null}
		</>
	);
};

TradingBlock.propTypes = {
	gameOver: PropTypes.bool.isRequired,
	phase: PropTypes.number.isRequired,
	userPicks: PropTypes.arrayOf(PropTypes.object).isRequired,
	userRoster: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default TradingBlock;

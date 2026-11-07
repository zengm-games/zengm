import { OverlayTrigger, Popover } from "react-bootstrap";
import type { PlayerSalaryRow } from "../../../common/types.ts";
import { TeamAbbrevLink } from "../../components/TeamAbbrevLink.tsx";
import { helpers } from "../../util/helpers.ts";

type Payer = PlayerSalaryRow["payers"][number];

const RELEASED_TITLE = "Owed by the team that released him";

const PayerAbbrev = ({ payer, season }: { payer: Payer; season: number }) => {
	return (
		<>
			<TeamAbbrevLink tid={payer.tid} abbrev={payer.abbrev} season={season} />
			{payer.released ? (
				<span className="text-body-secondary" title={RELEASED_TITLE}>
					{" "}
					(released)
				</span>
			) : null}
		</>
	);
};

// Team(s) that paid a season of a contract, or that are expected to pay it. If there are several, the one that paid the most is highlighted, and clicking it shows all of them.
const SalaryPayers = ({
	payers,
	season,
}: {
	payers: Payer[];
	season: number;
}) => {
	if (payers.length === 0) {
		return null;
	}

	if (payers.length === 1) {
		return <PayerAbbrev payer={payers[0]!} season={season} />;
	}

	return (
		<OverlayTrigger
			trigger="click"
			placement="auto"
			overlay={
				<Popover>
					<Popover.Body>
						<ul className="list-unstyled mb-0">
							{payers.map((payer) => (
								<li
									key={payer.tid}
									className="d-flex justify-content-between gap-2"
								>
									<div>
										<PayerAbbrev payer={payer} season={season} />
									</div>
									<div>{helpers.formatCurrency(payer.amount, "M")}</div>
								</li>
							))}
						</ul>
					</Popover.Body>
				</Popover>
			}
			rootClose
		>
			<button
				className="btn btn-link p-0"
				title="Paid by multiple teams"
				type="button"
			>
				{payers[0]!.abbrev}+{payers.length - 1}
			</button>
		</OverlayTrigger>
	);
};

export const wrappedSalaryPayers = (row: PlayerSalaryRow) => {
	return {
		value: <SalaryPayers payers={row.payers} season={row.season} />,
		searchValue: row.payers.map((payer) => payer.abbrev).join(" "),
		sortValue: row.payers[0]?.abbrev ?? "",
	};
};

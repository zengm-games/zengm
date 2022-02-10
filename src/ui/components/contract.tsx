import { helpers, PHASE } from "../../common";
import type { Phase, PlayerContract } from "../../common/types";
import { useLocalShallow } from "../util";

type ContractPlayer = {
	draft: {
		year: number;
	};
	contract: PlayerContract;
};

// If a player was just drafted and the regular season hasn't started, then he can be released without paying anything
export const wasJustDrafted = (
	p: ContractPlayer,
	phase: Phase,
	season: number,
) => {
	return (
		!!p.contract.rookie &&
		((p.draft.year === season && phase >= PHASE.DRAFT) ||
			(p.draft.year === season - 1 &&
				phase < PHASE.REGULAR_SEASON &&
				phase >= 0))
	);
};

const useJustDrafted = (p: ContractPlayer) => {
	const { phase, season } = useLocalShallow(state => ({
		phase: state.phase,
		season: state.season,
	}));

	return wasJustDrafted(p, phase as any, season);
};

const NON_GUARANTEED_CONTRACT_TEXT =
	"Contracts for drafted players are not guaranteed until the regular season. If you release a drafted player before then, you pay nothing.";

export const ContractAmount = ({
	p,
	override,
}: {
	p: ContractPlayer;
	override?: number;
}) => {
	const justDrafted = useJustDrafted(p);

	return (
		<span
			className={justDrafted ? "fst-italic" : undefined}
			title={justDrafted ? NON_GUARANTEED_CONTRACT_TEXT : undefined}
		>
			{helpers.formatCurrency(override ?? p.contract.amount, "M")}
		</span>
	);
};

export const wrappedContractAmount = (p: ContractPlayer, override?: number) => {
	const formatted = helpers.formatCurrency(override ?? p.contract.amount, "M");

	return {
		value: <ContractAmount p={p} override={override} />,
		sortValue: formatted,
		searchValue: formatted,
	};
};

export const ContractExp = ({
	p,
	override,
}: {
	p: ContractPlayer;
	override?: number;
}) => {
	const justDrafted = useJustDrafted(p);

	return (
		<span
			className={justDrafted ? "fst-italic" : undefined}
			title={justDrafted ? NON_GUARANTEED_CONTRACT_TEXT : undefined}
		>
			{override ?? p.contract.exp}
		</span>
	);
};

export const wrappedContractExp = (p: ContractPlayer, override?: number) => {
	const formatted = override ?? p.contract.exp;

	return {
		value: <ContractExp p={p} override={override} />,
		sortValue: formatted,
		searchValue: formatted,
	};
};

export const Contract = ({ p }: { p: ContractPlayer }) => {
	const justDrafted = useJustDrafted(p);

	return (
		<>
			<ContractAmount p={p} />
			<span
				className={justDrafted ? "fst-italic" : undefined}
				title={justDrafted ? NON_GUARANTEED_CONTRACT_TEXT : undefined}
			>
				{" "}
				thru{" "}
			</span>
			<ContractExp p={p} />
		</>
	);
};

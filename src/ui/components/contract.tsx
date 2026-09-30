import clsx from "clsx";
import type { PlayerContract } from "../../common/types.ts";
import { helpers } from "../util/helpers.ts";
import { useLocal } from "../util/local.ts";

// Contract amount doesn't need exp, which may be undefined for a range of seasons
type ContractAmountPlayer = {
	draft: {
		year: number;
	};
	contract: Pick<PlayerContract, "amount" | "rookie">;
};

type ContractPlayer = ContractAmountPlayer & {
	contract: PlayerContract;
};

const useJustDrafted = (p: ContractAmountPlayer) => {
	const { phase, season } = useLocal(["phase", "season"]);

	return helpers.justDrafted(p, phase, season);
};

const NON_GUARANTEED_CONTRACT_TEXT =
	"Contracts for drafted players are not guaranteed until the regular season. If you release a drafted player before then, you pay nothing.";

export const ContractAmount = ({
	p,
	override,
}: {
	p: ContractAmountPlayer;
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

export const wrappedContractAmount = (
	p: ContractAmountPlayer,
	override?: number,
) => {
	const formatted = helpers.formatCurrency(override ?? p.contract.amount, "M");

	return {
		value: <ContractAmount p={p} override={override} />,
		sortValue: p.contract.amount,
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

	const { season } = useLocal(["season"]);
	const expiring = season === p.contract.exp;

	return (
		<span
			className={clsx({
				"fst-italic": justDrafted,
				"fw-bold": expiring,
			})}
			title={
				justDrafted
					? NON_GUARANTEED_CONTRACT_TEXT
					: expiring
						? "Expiring contract"
						: undefined
			}
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

export const wrappedContract = (p: ContractPlayer) => {
	const formattedAmount = helpers.formatCurrency(p.contract.amount, "M");
	const formatted = `${formattedAmount} thru ${p.contract.exp}`;

	return {
		value: <Contract p={p} />,
		sortValue: p.contract.amount,
		searchValue: formatted,
	};
};

import classNames from "classnames";
import type { PlayerContract } from "../../common/types";
import { helpers, useLocal, useLocalPartial } from "../util";

type ContractPlayer = {
	draft: {
		year: number;
	};
	contract: PlayerContract;
};

const useJustDrafted = (p: ContractPlayer) => {
	const { phase, season } = useLocalPartial(["phase", "season"]);

	return helpers.justDrafted(p, phase as any, season);
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

	const season = useLocal(state => state.season);
	const expiring = season === p.contract.exp;

	return (
		<span
			className={classNames({
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

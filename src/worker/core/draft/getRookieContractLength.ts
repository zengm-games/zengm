import { g } from "../../util";

const getRookieContractLength = (draftRound: number) => {
	const rookieContractLengths = g.get("rookieContractLengths");
	return (
		rookieContractLengths[draftRound - 1] ?? rookieContractLengths.at(-1) ?? 2
	);
};

export default getRookieContractLength;

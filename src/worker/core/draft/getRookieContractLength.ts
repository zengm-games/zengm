import { g } from "../../util/index.ts";

const getRookieContractLength = (draftRound: number) => {
	const rookieContractLengths = g.get("rookieContractLengths");
	return (
		rookieContractLengths[draftRound - 1] ?? rookieContractLengths.at(-1) ?? 2
	);
};

export default getRookieContractLength;

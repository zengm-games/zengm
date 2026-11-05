import { g } from "../../util/index.ts";
import type { PlayerWithoutKey } from "../../../common/types.ts";

// Set what a player is asking for in a new contract. To actually sign a contract, use player.sign.
const setContractDemand = (
	p: Pick<PlayerWithoutKey, "contractDemand">,
	contractDemand: NonNullable<PlayerWithoutKey["contractDemand"]>,
) => {
	// Sigh, don't know why this is needed, but people tell me that sometimes the #1 pick has a massively negative contract
	if (contractDemand.amount < 0) {
		contractDemand.amount = g.get("minContract");
	}

	p.contractDemand = contractDemand;
};

export default setContractDemand;

import { g } from "../../util/index.ts";
import type { Award, PlayerAwardBuiltIn } from "../../../common/types.ts";

const getInitials = (string: string) => {
	return (
		string
			.match(/\b\p{L}/gu)
			?.join("")
			.toUpperCase() ?? ""
	);
};

export const getGroupPrefix = (
	award: Pick<Award, "group"> | Pick<PlayerAwardBuiltIn, "group">,
	season: number,
) => {
	const group = award.group;
	if (group) {
		if (group.type === "conf") {
			const confs = g.get("confs", season);
			const conf = confs.find((conf) => conf.cid === group.cid);
			if (conf) {
				return conf.abbrev ?? getInitials(conf.name);
			}
		} else if (group.type === "div") {
			const divs = g.get("divs", season);
			const div = divs.find((div) => div.did === group.did);
			if (div) {
				return div.abbrev ?? getInitials(div.name);
			}
		}
	}
};

export const formatAwardNamePrefix = (
	award: Pick<Award, "group" | "name" | "shortName">,
	season: number,
	short?: boolean,
) => {
	const prefix = getGroupPrefix(award, season) ?? "";

	if (short) {
		return `${prefix}${award.shortName}`;
	}

	return `${prefix} ${award.name}`;
};

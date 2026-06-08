// Derive a descriptive role/archetype from a player's skills + tendencies.
// Pure & heuristic; used for display (and, later, AI lineup hints).
const getRole = (r: any): string => {
	const t = (key: string) => r[key] ?? 50;

	const three = t("tendencyThree");
	const post = t("tendencyPost");
	const rim = t("tendencyAtRim");
	const passT = t("tendencyPass");
	const usage = t("tendencyUsage");

	const big = r.hgt >= 62;
	const shooter = r.tp >= 55;

	if (big) {
		if (shooter && three >= 52) {
			return "Stretch Big";
		}
		if (r.diq >= 62 && r.hgt >= 68) {
			return "Rim Protector";
		}
		if (r.ins >= 58 || post >= 58) {
			return "Post Scorer";
		}
		if (r.reb >= 62) {
			return "Glass Cleaner";
		}
		return "Interior Big";
	}

	if (r.pss >= 62 && passT >= 52) {
		return "Floor General";
	}
	if (shooter && three >= 58 && usage <= 52) {
		return "3-Point Specialist";
	}
	if (r.tp >= 50 && r.diq >= 58) {
		return "3&D Wing";
	}
	if (usage >= 58 && rim >= 54) {
		return "Slasher";
	}
	if (usage >= 62) {
		return "Shot Creator";
	}
	if (r.diq >= 62) {
		return "Perimeter Defender";
	}
	return "Role Player";
};

export default getRole;

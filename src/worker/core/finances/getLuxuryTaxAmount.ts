import { g } from "../../util";

const getLuxuryTaxAmount = (payroll: number) => {
	// Only apply luxury tax if hard cap is disabled!
	if (payroll > g.get("luxuryPayroll") && g.get("salaryCapType") !== "hard") {
		return g.get("luxuryTax") * (payroll - g.get("luxuryPayroll"));
	}

	return 0;
};

export default getLuxuryTaxAmount;

import { g } from "../../util/index.ts";

const getMinPayrollAmount = (payroll: number) => {
	if (payroll < g.get("minPayroll")) {
		return g.get("minPayroll") - payroll;
	}

	return 0;
};

export default getMinPayrollAmount;

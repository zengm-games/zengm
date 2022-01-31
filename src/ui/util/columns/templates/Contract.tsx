import { helpers } from "../../index";
import type { TemplateProps } from "../getCols";

export default ({ p, c, vars }: TemplateProps) =>
	helpers.formatCurrency(p.contract.amount, "M") +
	(c.options?.format == "full" ? ` thru ${p.contract.exp}` : "");

import type { TemplateProps } from "../getCols";
import { helpers } from "../../index";

export default ({ p, c, vars }: TemplateProps) =>
	`${helpers.formatCurrency(p.contractDesired.amount, "M")}`;

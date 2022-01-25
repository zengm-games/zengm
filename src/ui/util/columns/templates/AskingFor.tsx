import { helpers } from "../../index";
import type { TemplateProps } from "../getCols";

export default ({ p, c, vars }: TemplateProps) =>
	helpers.formatCurrency(p.mood.user.contractAmount / 1000, "M");

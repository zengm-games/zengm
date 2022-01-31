import type { TemplateProps } from "../getCols";

export default ({ p, c, vars }: TemplateProps) => {
	const key: string = c.stats[0];
	if (!(key in p.stats)) return `${key} not found`;
	const value = p.stats[key];
	return typeof value == "number"
		? value.toFixed(c.options ? c.options.decimals : 1)
		: value;
};

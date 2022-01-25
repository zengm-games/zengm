import type { TemplateProps } from "../getCols";

export default ({ p, c, vars }: TemplateProps) => {
	const key: string = c.stats[0];
	return key in p.stats ? p.stats[key].toFixed(1) : `${key} not found`;
};

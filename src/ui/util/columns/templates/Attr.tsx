import type { TemplateProps } from "../getCols";

export default ({ p, c, vars }: TemplateProps) => {
	const key: string = c.attrs[0];
	if (!(key in p)) return `${key} not found`;
	return p[key];
};

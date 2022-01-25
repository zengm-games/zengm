import type { TemplateProps } from "../getCols";

export default ({ p, c, vars }: TemplateProps) =>
	p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : null;

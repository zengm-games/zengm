import type { TemplateProps } from "../getCols";
import { dataTableWrappedMood } from "../../../components/Mood";

export default ({ p, c, vars }: TemplateProps) =>
	dataTableWrappedMood({ defaultType: "current", maxWidth: true, p });

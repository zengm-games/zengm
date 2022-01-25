import type { TemplateProps } from "../getCols";
import { dataTableWrappedMood } from "../../../components/Mood";

export default ({ p, c, vars }: TemplateProps) =>
	dataTableWrappedMood({ defaultType: "user", maxWidth: true, p });

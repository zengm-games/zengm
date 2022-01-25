import type { TemplateProps } from "../getCols";
import { wrappedWeight } from "../../../components/Weight";

export default ({ p, c, vars }: TemplateProps) => wrappedWeight(p.weight);

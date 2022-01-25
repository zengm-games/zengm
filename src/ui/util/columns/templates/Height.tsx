import type { TemplateProps } from "../getCols";
import { wrappedHeight } from "../../../components/Height";

export default ({ p, c, vars }: TemplateProps) => wrappedHeight(p.hgt);

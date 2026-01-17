import type { Col } from "../ui/components/DataTable/index.tsx";
import getCols from "./getCols.ts";

const getCol = (title: string, overrides?: Partial<Col>): Col => {
	const overrides2 = overrides ? { [title]: overrides } : undefined;
	return getCols([title], overrides2)[0]!;
};

export default getCol;

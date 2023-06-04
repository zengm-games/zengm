import { random } from "../../util";

const defaultBudgetLevel = () => {
	return random.randInt(1, 100);
};

export default defaultBudgetLevel;

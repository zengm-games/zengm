import EditAwardsBasketball from "./EditAwards.basketball";
import EditAwardsFootball from "./EditAwards.football";

const EditAwards =
	process.env.SPORT === "football" ? EditAwardsFootball : EditAwardsBasketball;

export default EditAwards;

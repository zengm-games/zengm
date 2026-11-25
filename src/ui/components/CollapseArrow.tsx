import { AnimatePresence, m } from "framer-motion";

// Points down when open
const CollapseArrow = ({
	closedDirection = "right",
	open,
}: {
	closedDirection?: "left" | "right";
	open: boolean;
}) => {
	return (
		<AnimatePresence initial={false}>
			<m.span
				animate={open ? "open" : "collapsed"}
				variants={{
					// Quarter turn to point down, clockwise from right or counterclockwise from left
					open: { rotate: closedDirection === "left" ? -90 : 90 },
					collapsed: { rotate: 0 },
				}}
				transition={{
					duration: 0.3,
					type: "tween",
				}}
				className={
					closedDirection === "left"
						? "glyphicon glyphicon-triangle-left"
						: "glyphicon glyphicon-triangle-right"
				}
			/>
		</AnimatePresence>
	);
};

export default CollapseArrow;

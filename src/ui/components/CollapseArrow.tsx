import { AnimatePresence, m } from "framer-motion";

const CollapseArrow = ({ open }: { open: boolean }) => {
	return (
		<AnimatePresence initial={false}>
			<m.span
				animate={open ? "open" : "collapsed"}
				variants={{
					open: { rotate: 90 },
					collapsed: { rotate: 0 },
				}}
				transition={{
					duration: 0.3,
					type: "tween",
				}}
				className="glyphicon glyphicon-triangle-right"
			/>
		</AnimatePresence>
	);
};

export default CollapseArrow;

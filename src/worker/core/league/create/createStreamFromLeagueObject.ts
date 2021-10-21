import { CUMULATIVE_OBJECTS } from "../../../api/leagueFileUpload";
import { highWaterMark } from "../createStream";

// Silly to stream this, since leagueObject is already in memory, but this allows us to unify the input to league creation
const createStreamFromLeagueObject = (
	leagueObject: Record<string, unknown>,
) => {
	const keys = Object.keys(leagueObject);
	let i: number = 0;
	let j: number = 0;

	const readableStream = new ReadableStream(
		{
			pull(controller) {
				const emitOneRecord = () => {
					const key = keys[i];

					if (key === undefined) {
						controller.close();
						return;
					}

					const object = leagueObject[key];

					if (CUMULATIVE_OBJECTS.has(key)) {
						controller.enqueue({
							key,
							value: object,
						});
						i += 1;
						j = 0;
					} else {
						const row = (object as any)?.[j];
						if (row !== undefined) {
							controller.enqueue({
								key,
								value: row,
							});
							j += 1;
						} else {
							i += 1;
							j = 0;
							emitOneRecord();
						}
					}
				};

				emitOneRecord();
			},
		},
		new CountQueuingStrategy({
			highWaterMark,
		}),
	);

	return readableStream;
};

export default createStreamFromLeagueObject;

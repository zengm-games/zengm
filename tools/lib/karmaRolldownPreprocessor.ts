// Based on https://github.com/jlmakes/karma-rollup-preprocessor
// watch mode is broken, not sure why

import path from "node:path";
import chokidar from "chokidar";
import { rolldown } from "rolldown";

const hasNullByte = (string: string) => string.includes("\u0000");

const createWatcher = (emitter: any) => {
	const files = new Map();
	const watch = chokidar.watch([]);

	const refreshFile = (filePath: string) => {
		/**
		 * Had to go diving for this one...
		 * not exactly Karma’s public facing API,
		 * but appears to get the job done =)
		 */
		const isPOSIX = path.sep === "/";
		filePath = isPOSIX ? filePath : filePath.replace(/\\/g, "/");
		emitter._fileList.changeFile(filePath, true);
	};

	const handleChange = (path: string) => {
		for (const [entry, dependencies] of files.entries()) {
			if (entry === path || dependencies.includes(path)) {
				return refreshFile(entry);
			}
		}
	};

	//watch.on('change', debounce(handleChange, 150))
	watch.on("change", handleChange);

	return {
		add(entry: string, dependencies: string[]) {
			if (!hasNullByte(entry)) {
				const filteredDependencies = dependencies.filter(
					(path) => !hasNullByte(path),
				);
				files.set(entry, filteredDependencies);
				watch.add([entry, ...filteredDependencies]);
			}
		},
	};
};

const createPreprocessor = (
	preconfig: any,
	config: any,
	emitter: any,
	logger: any,
) => {
	const log = logger.create("preprocessor.rolldown");

	let watcher: ReturnType<typeof createWatcher> | undefined;
	if (!config.singleRun && config.autoWatch) {
		watcher = createWatcher(emitter);
	}

	return async (
		original: string,
		file: any,
		done: (error: Error | null, code: string | null) => void,
	) => {
		const originalPath = file.originalPath;
		const location = path.relative(config.basePath, originalPath);
		try {
			const options = Object.assign(
				{},
				config.rolldownPreprocessor,
				preconfig.options,
				{
					input: originalPath,
				},
			);

			if (
				options.output.dir === undefined &&
				options.output.file === undefined
			) {
				options.output.dir = path.dirname(originalPath);
			}

			log.info("Generating bundle for ./%s", location);
			const bundle = await rolldown(options);
			const { output } = await bundle.generate();

			if (watcher) {
				const [entry, ...dependencies] = await bundle.watchFiles;
				if (entry !== undefined) {
					watcher.add(entry, dependencies);
				}
			}

			await bundle.close();

			for (const result of output) {
				if (result.type !== "asset") {
					const { code, map, facadeModuleId, fileName } = result;

					/**
					 * processors that have alternate source file extensions
					 * must make sure to use the file name output by rolldown.
					 */
					if (facadeModuleId && !hasNullByte(facadeModuleId)) {
						const { dir } = path.parse(originalPath);
						file.path = path.posix.join(dir, fileName);
					}

					file.sourceMap = map;

					const processed =
						options.output.sourcemap === "inline" && map
							? code + `\n//# sourceMappingURL=${map.toUrl()}\n`
							: code;

					return done(null, processed);
				}
			}
			log.warn("Nothing was processed.");
			done(null, original);
		} catch (error) {
			// https://github.com/jlmakes/karma-rollup-preprocessor/pull/77/files
			log.error(
				"Failed to process ./%s\n%s\n%s\n",
				location,
				error.message || "\n",
				error.stack,
			);
			done(error, null);
		}
	};
};

export default {
	"preprocessor:rolldown": [
		"factory",
		((factory: any) => {
			factory.$inject = ["args", "config", "emitter", "logger"];
			return factory;
		})(createPreprocessor),
	],
};

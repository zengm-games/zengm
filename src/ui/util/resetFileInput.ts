import type { MouseEvent } from "react";

const resetFileInput = (event: MouseEvent<HTMLInputElement>) => {
	// Without this, then selecting the same file twice will do nothing because the browser dedupes by filename.
	// That is very annoying when repeatedly editing/checking a file.
	// @ts-ignore
	event.target.value = "";
};

export default resetFileInput;

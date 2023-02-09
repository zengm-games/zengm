// Chrome 64, Safari 13.1
import { ResizeObserver as ResizeObserverPolyfill } from "@juggle/resize-observer";
if (!window.ResizeObserver) {
	window.ResizeObserver = ResizeObserverPolyfill;
}

// Needed for some reason
export default 1;

// Comments indicate where I'd have to bump minimum supported browser versions to get rid of these.

// Safari 11 (because in 10.1 getAll crashes in a worker)
import "indexeddb-getall-shim";

// Chrome 54, Safari 10.1
// Inlined from MDN, since object.entries and object.values npm packages were somehow adding 50kb to each bundle
if (!Object.entries) {
	Object.entries = (obj: any) => {
		const ownProps = Object.keys(obj);
		let i = ownProps.length;
		const resArray = new Array(i); // preallocate the Array

		while (i--) {
			resArray[i] = [ownProps[i], obj[ownProps[i]]];
		}

		return resArray;
	};
}
if (!Object.values) {
	Object.values = (obj: any) => {
		const ownProps = Object.keys(obj);
		let i = ownProps.length;
		const resArray = new Array(i); // preallocate the Array

		while (i--) {
			resArray[i] = obj[ownProps[i]];
		}

		return resArray;
	};
}

import "./polyfills-modern";

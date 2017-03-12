import Backboard from 'backboard';
import lie from '../../vendor/lie';

// Because of http://stackoverflow.com/q/28388129/786644 native promises often don't play nice with IndexedDB
// transactions, like in Firefox. Because of http://stackoverflow.com/q/42660581/786644 the best workaround I could find
// was (ugh) synchronous promises, implemented with a slightly modified version of https://github.com/calvinmetcalf/lie

const checkPromiseImplementation = () => {
    return new Promise((resolve, reject) => {
        const request = self.indexedDB.open('test-idb-microtasks', 1);
        request.onerror = (event) => reject(event.target.error);
        request.onblocked = () => reject('Blocked');
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore('whatever', {keyPath: 'id'});
        };
        request.onsuccess = (event) => {
            const db = event.target.result;
            const tx = db.transaction('whatever');
            Promise.resolve().then(() => {
                // If the transaction is still open here, then everything will work and no polyfill is needed. But if
                // the transaction is closed, using it will produce an error here, and we'll need a polyfill to deal
                // with similar situations elsewhere.

                try {
                    tx.objectStore('whatever');
                    console.log('Using native promises');
                } catch (err) {
                    if (err.name === 'InvalidStateError') {
                        console.log('Using sync promise polyfill');
                        self.Promise = lie;
                        Backboard.setPromiseConstructor(self.Promise);
                    } else {
                        reject(err);
                        return;
                    }
                }

                resolve();
            });
        };
    });
};

export default checkPromiseImplementation;

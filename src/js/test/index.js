/* eslint-disable import/first */
import "../vendor/babel-external-helpers";
import "indexeddb-getall-shim";

mocha.setup({
    ui: "bdd",
    timeout: 20000,
});

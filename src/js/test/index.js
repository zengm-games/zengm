import '../vendor/babel-external-helpers';
import {checkPromiseImplementation} from '../worker/util';

mocha.setup({
    ui: 'bdd',
    timeout: 20000,
});

before(async () => {
    await checkPromiseImplementation();
});

// define inconsistency should be fixed in Vitest 5.0.1 https://github.com/vitest-dev/vitest/issues/11164
(globalThis as any).__SPORT = "basketball";
(globalThis as any).__NODE_ENV = "test";

import "../common/polyfills.ts";
import { overridePostMessage } from "./overridePostMessage.ts";

overridePostMessage();

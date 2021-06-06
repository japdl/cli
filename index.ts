import japscandl from "japscandl";
import CLInterface from "./src/CLInterface";
import config from "./src/utils/config";
import flags from "./src/utils/flags";
import ipc from "node-ipc";

// pour browser wrapper
const configVariables = config.getConfigVariables();
const chromePath = japscandl.utils.chrome.getChromePath(configVariables.chromePath);
const f = flags.getFlags();

japscandl.getBrowser(f.headless, chromePath)
    .then(async (browser) => {
        const inter = new CLInterface(browser, {flags: f, outputDirectory: configVariables.outputDirectory});
        inter.start();
    })
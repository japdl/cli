import japscandl from "japscandl";
import CLInterface from "./src/components/CLInterface";
import config from "./src/utils/config";
import flags from "./src/utils/flags";

// pour browser wrapper
const configVariables = config.getConfigVariables();
const chromePath = japscandl.utils.chrome.getChromePath(configVariables.chromePath);
const f = flags.getFlags();
japscandl.getBrowser(f.headless, chromePath)
    .then(async (browser) => {
        const inter = new CLInterface(browser);
        inter.start();
    })
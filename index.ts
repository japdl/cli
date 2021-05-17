import getBrowser from "./src/utils/browser";
import CLInterface from "./src/components/CLIInterface";
import chrome from "./src/utils/chrome";
import config from "./src/utils/config";
import flags from "./src/utils/flags";

// pour browser wrapper
const configVariables = config.getConfigVariables();
const chromePath = chrome.getChromePath(configVariables.chromePath);
const f = flags.getFlags();
getBrowser(f.headless, chromePath)
    .then(async (browser) => {
        const inter = new CLInterface(browser);
        inter.start();
    })



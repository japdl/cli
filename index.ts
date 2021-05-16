import yargs from "yargs";
import chrome from "./src/utils/chrome";
import config from "./src/utils/config";

// pour browser wrapper
const configVariables = config.getConfigVariables();
const chromePath = chrome.getChromePath(configVariables.chromePath);


const flags = yargs(process.argv.slice(2))
    .option("verbose", { alias: "v", boolean: true, default: false })
    .option("headless", { alias: "h", boolean: true, default: false })
    .option("fast", { alias: "f", boolean: true, default: false })
    .option("timeout", { alias: "t", number: true, default: 60 }).argv;

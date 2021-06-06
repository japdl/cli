import yargs from "yargs";

const flags = {
    getFlags(): {
        verbose: boolean,
        headless: boolean,
        fast: boolean,
        timeout: number,
    }{
        const flags = yargs(process.argv.slice(2))
            .option("verbose", { alias: "v", boolean: true, default: false })
            .option("headless", { alias: "h", boolean: true, default: false })
            .option("fast", { alias: "f", boolean: true, default: false })
            .option("timeout", { alias: "t", number: true, default: 60 })
            .argv;
        return flags;
    }
}

export default flags;
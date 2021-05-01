import CLIInterface from "../src/CLIInterface";

module.exports = {
    description: "Quitte le programme",
    usage: "quit",
    aliases: ["q"],
    argsNeeded: 0,
    async execute(inter: CLIInterface): Promise<void> {
        inter.quit();
    }
}
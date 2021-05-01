import CLIInterface from "../src/CLIInterface";

module.exports = {
    description: "Affiche l'aide",
    usage: "help",
    aliases: ["aide", "h"],
    argsNeeded: 0,
    async execute(inter: CLIInterface): Promise<void> {
        inter.dynamicDisplayHelp();
    }
}
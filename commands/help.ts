import CLInterface from "../src/components/CLIInterface";

module.exports = {
    description: "Affiche l'aide",
    usage: "help",
    aliases: ["aide", "h"],
    argsNeeded: 0,
    async execute(inter: CLInterface): Promise<void> {
        inter.dynamicDisplayHelp();
    }
}
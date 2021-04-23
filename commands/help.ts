import Interface from "../src/interface";

module.exports = {
    description: "Affiche l'aide",
    usage: "help",
    aliases: ["aide", "h"],
    argsNeeded: 0,
    async execute(inter: Interface): Promise<void> {
        inter.dynamicDisplayHelp();
    }
}
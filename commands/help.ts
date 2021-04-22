import Interface from "../src/interface";

module.exports = {
    description: "Montre l'aide dans la console",
    usage: "help",
    aliases: ["aide", "h"],
    async execute(inter: Interface): Promise<void> {
        inter.displayHelp();
    }
}
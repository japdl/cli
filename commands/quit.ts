import Interface from "../src/interface";

module.exports = {
    description: "Quitte le programme",
    usage: "quit",
    aliases: ["q"],
    argsNeeded: 0,
    async execute(inter: Interface): Promise<void> {
        inter.quit();
    }
}
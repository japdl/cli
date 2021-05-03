import CLIInterface from "../src/CLIInterface";
import fs from "fs";

module.exports = {
    description: "Charge un fichier donné après la commande et execute les commandes à l'intérieur",
    usage: "fichier <chemin-vers-le-fichier>",
    example: ["fichier commandes.txt"],
    aliases: ["f"],
    argsNeeded: 1,
    async execute(inter: CLIInterface, args: string[]): Promise<void> {
        const fileContent = fs.readFileSync(args[0], 'utf-8');
        fileContent.split('\n').forEach(async (line) => {
            const goodLine = line.trim();
            await inter.readCommands(goodLine);
        });
    }
}
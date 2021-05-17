import fs from "fs";
import CLInterface from "../src/components/CLIInterface";

module.exports = {
    description: "Charge un fichier donné après la commande et execute les commandes à l'intérieur",
    usage: "fichier <chemin-vers-le-fichier>",
    example: ["fichier commandes.txt"],
    aliases: ["f"],
    argsNeeded: 1,
    async execute(inter: CLInterface, args: string[]): Promise<void> {
        const fileContent = fs.readFileSync(args[0], 'utf-8');
        for (const line of fileContent.split('\n').map((line) => line.trim())) {
            const start = new Date();
            console.log("Début de la commande: " + line);
            await inter.readCommands(line);
            console.log(`Fin de la commande: "${line}", durée: : ${(+new Date().getTime() - +start.getTime()) / 1000} secondes`);
        }
    }
}
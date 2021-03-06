import CLInterface from "../src/CLInterface";

module.exports = {
    description: "Donne le nombre de volumes et de chapitres du manga donné en paramètre, s'il est possible de récupérer cette information.",
    usage: "info <nom-du-manga>",
    aliases: ["i"],
    example: ["info one-piece"],
    argsNeeded: 1,
    async execute(inter: CLInterface, args: string[]): Promise<void> {
        function prettyPrint(value: number, type: string) {
            console.log(`${mangaName} possède ${value} ${type}${(value > 1) ? "s" : ""}`);
        }
        const mangaName = args[0];
        const mangaStats = await inter.fetchStats(mangaName);
        if (!isNaN(mangaStats.volumes)) {
            prettyPrint(mangaStats.volumes, "volume");
        }
        if (!isNaN(mangaStats.chapters)) {
            prettyPrint(mangaStats.chapters, "chapitre");
        }
        if (mangaName !== mangaStats.name) {
            console.log(`Le manga '${mangaName}' s'appelle '${mangaStats.name}' sur japscan`);
        }
    }
}
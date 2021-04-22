import Interface from "../src/interface";

module.exports = {
    description: "Donne le nombre de volumes et de chapitres du manga donné en paramètre, si c'est possible de récupérer cette information.",
    usage: "info <manga-name>",
    aliases: ["i"],
    async execute(inter: Interface, args: string[]): Promise<void> {
        function prettyPrint(value: number, type: string) {
            console.log(`${mangaName} possède ${value} ${type}${(value > 1) ? "s" : ""}`);
        }
        const mangaName = args[0];
        const mangaStats: MangaStats = await inter.fetchStats(mangaName);
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
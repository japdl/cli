import CLIInterface from "../src/CLIInterface";
import path from "path";
import manga from "../src/utils/manga";
import mangaFormat from "../src/utils/mangaFormat";

module.exports = {
    description: "Télécharge le volume|chapitre du manga indiqué, puis en fait un cbr. Le flag 's' supprime les dossiers d'images après le téléchargement, 'f' force le téléchargement si les dossiers sont déjà trouvés sur le disque et 'n' ne fabrique pas le cbr après le téléchargement.",
    usage: "telecharge <nom-du-manga> <volume|vol|v|chapitre|chap|c> <numéro(s)> <optionnel: flag(s|f|n)>",
    example: ["telecharge one-piece volume 99 s", "telecharge one-piece volume 99", "telecharge chainsaw-man chapitre 50", "telecharge fire-punch volume 1-8", "telecharge demon-slayer chapitre 1-50"],
    aliases: ["t"],
    argsNeeded: 3,
    async execute(inter: CLIInterface, args: string[]): Promise<void> {
        const mangaName = args[0];
        const format = mangaFormat.returnFullFormat(args[1]);
        if (!format) {
            throw new Error(mangaFormat.stringError(args[1]));
        }
        const toDownload: { start: number, end: number } | number | Error = await manga.handleRange(inter, mangaName, format, args[2]);
        if (toDownload instanceof Error) {
            throw toDownload;
        }
        if (args[3] === undefined) args[3] = '';

        const zip = !args[3].includes('n');
        const deleteAfter = args[3].includes('s');

        if (deleteAfter && !zip) {
            throw new Error("Le programme ne peut pas supprimer les dossiers d'images et ne pas faire de cbr en même temps. (Flags s et n présents en même temps)");
        }
        if (format === "volume") {
            if (typeof toDownload !== "number") {
                const downloadLocationsArray = await inter.downloadVolumes(mangaName, toDownload.start, toDownload.end, zip);
                if (deleteAfter) {
                    downloadLocationsArray.forEach((downloadLocations) => {
                        manga.rmLocations(downloadLocations);
                    });
                }
            } else {
                if (!args[3].includes('f')) {
                    const cbr = manga.alreadyDownloaded(inter.getCbrFrom(mangaName, toDownload.toString(), "volume"), false);
                    if (cbr) {
                        throw new Error(`Le chapitre est déjà en cbr, si vous voulez quand même le re-télécharger, il faut spécifier l'argument 'f' après le numéro de chapitre.`);
                    }
                }
                const downloadLocations = await inter.downloadVolume(mangaName, toDownload, zip);
                if (deleteAfter) {
                    manga.rmLocations(downloadLocations);
                }
            }

        } else if (format === "chapitre") {
            if (typeof toDownload !== "number") {
                const downloadLocations = await inter.downloadChapters(mangaName, toDownload.start, toDownload.end, zip);
                if (deleteAfter) {
                    manga.rmLocations(downloadLocations);
                }
            } else {
                if (!args[3].includes('f')) {
                    const reasons = [];
                    const folder = manga.alreadyDownloaded(path.join(inter.outputDirectory, mangaName, toDownload.toString()));
                    if (folder) reasons.push("téléchargé");
                    const cbr = manga.alreadyDownloaded(inter.getCbrFrom(mangaName, toDownload.toString(), "chapitre"), false);
                    if (cbr) reasons.push("en cbr");
                    if (folder || cbr)
                        throw new Error(`Le chapitre est déjà ${reasons.join(' et ')}, si vous voulez quand même le re-télécharger, il faut spécifier l'argument 'f' après le numéro de chapitre.`);
                }
                const downloadLocation = await inter.downloadChapter(mangaName, toDownload, zip);
                if (deleteAfter) {
                    manga.rmLocations([downloadLocation]);
                }
            }
        } else {
            throw new Error("Le type de téléchargement n'a pas été reconnu, il doit être soit 'volume', soit 'chapitre'");
        }
    }
}
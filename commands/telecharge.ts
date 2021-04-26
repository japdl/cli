import Interface from "../src/interface";
import utils from "../src/utils";

module.exports = {
    description: "Télécharge le volume|chapitre du manga indiqué, puis en fait un cbr. Le flag 's' supprime les dossiers d'images après le téléchargement, et 'f' force le téléchargement si les dossiers sont déjà trouvés sur le disque.",
    usage: "telecharge <nom-du-manga> <volume|chapitre> <numéro(s)> <optionnel: s et/ou f>",
    example: ["telecharge one-piece volume 99 s", "telecharge one-piece volume 99", "telecharge chainsaw-man chapitre 50", "telecharge fire-punch volume 1-8", "telecharge demon-slayer chapitre 1-50"],
    aliases: ["t"],
    argsNeeded: 3,
    async execute(inter: Interface, args: string[]): Promise<void> {
        const mangaName = args[0];
        const type = args[1];
        if (type !== "volume" && type !== "chapitre") {
            console.log("japdl ne peut pas télécharger de '" + type + "', il ne peut télécharger que:");
            console.log("- 'volume'");
            console.log("- 'chapitre'");
            return;
        }
        let range!: {start: number, end: number};
        let number!: number;
        if (args[2].indexOf('-') !== -1) {
            const split = args[2].split('-');
            range = { start: parseInt(split[0]), end: parseInt(split[1]) };
        } else {
            number = parseInt(args[2]);
            if (isNaN(number)) {
                console.log("le numéro de" + type + "n'a pas pu être lu");
                return;
            }
        }
        if (args[3] === undefined) {
            args[3] = '';
        }
        switch (type) {
            case "volume": {
                if (range) {
                    const downloadLocationsArray = await inter.downloadVolumes(mangaName, range.start, range.end);
                    downloadLocationsArray.forEach((downloadLocations) => {
                        utils.path.rmIfSFlag(args, downloadLocations);
                    });
                } else {
                    const downloadLocations = await inter.downloadVolume(mangaName, number);
                    utils.path.rmIfSFlag(args, downloadLocations);
                }
                break;
            }
            case "chapitre":
                if (range) {
                    const downloadLocations = await inter.downloadChapters(mangaName, range.start, range.end);
                    utils.path.rmIfSFlag(args, downloadLocations);
                } else {
                    if (args[3].toLowerCase().indexOf('f') === -1 && utils.path.alreadyDownloaded(inter.outputDirectory + "/" + mangaName + "/" + number)) {
                        console.log("Le chapitre est déjà téléchargé, si vous voulez quand même le re-télécharger,");
                        console.log("Il faut spécifier l'argument 'f' après le numéro de chapitre.");
                        return;
                    }
                    const downloadLocation = await inter.downloadChapter(mangaName, number);
                    utils.path.rmIfSFlag(args, [downloadLocation]);
                }
                break;
            default:
                console.log("Le type de téléchargement n'a pas été reconnu, il doit être soit 'volume', soit 'chapitre'");
                break;
        }
    }
}
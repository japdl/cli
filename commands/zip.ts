import Interface from "../src/interface";
import utils from "../src/utils";

module.exports = {
    description: "Fabrique un cbr du volume|chapitre indiqué",
    usage: "zip <nom-du-manga> <volume|chapitre> <numéro>",
    aliases: ["z", "cbr"],
    example: ["zip one-piece volume 99", "zip chainsaw-man chapitre 50"],
    argsNeeded: 3,
    async execute(inter: Interface, args: string[]): Promise<void> {
        const mangaName = args[0];
        const type = args[1];
        if (type !== "volume" && type !== "chapitre") {
            throw `japdl ne peut pas zipper de ${type}, il ne peut zipper que:
        - 'volume'
        - 'chapitre'`
        }
        const number = parseInt(args[2]);
        let toZip: string[] = [];
        if (type === 'chapitre') {
            const path = inter.getPathFrom({ chapter: number.toString(), manga: mangaName, page: "" + 1 });
            console.log(path);
            toZip = [path];
        }
        if (type === 'volume') {
            const chapters: string[] = await inter.fetchVolumeChapters(number, mangaName);
            chapters.forEach((chapter) => {
                toZip.push(inter.getPathFrom(chapter));
            });
        }
        const isWorthZipping = utils.path.tellIfDoesntExist(toZip);
        if (isWorthZipping) {
            utils.zipper.zipDirectories(toZip, inter.getCbrFrom(mangaName, number, type));
        }
    }
}
import CLInterface from "../src/CLIInterface";
import fsplus from "../src/utils/fsplus";
import manga from "../src/utils/manga";
import mangaFormat from "../src/utils/mangaFormat";
import url from "../src/utils/url";
import zipper from "../src/utils/zipper";

module.exports = {
    description: "Fabrique un cbr du volume|chapitre indiqué. Les intervalles s'écrivent séparées par des '-'.",
    usage: "zip <nom-du-manga> <volume|chapitre> <numéro|intervalle>",
    aliases: ["z", "cbr"],
    example: ["zip one-piece volume 99", "zip chainsaw-man chapitre 50", "zip one-punch-man chap 1-50"],
    argsNeeded: 3,
    async execute(inter: CLInterface, args: string[]): Promise<void> {
        const mangaName = args[0];
        const format = mangaFormat.returnFullFormat(args[1]);
        if (!format) {
            throw new Error(mangaFormat.stringError(args[1]));
        }
        const toDownload: { start: number, end: number } | number | Error = await manga.handleRange(inter, mangaName, format, args[2]);
        if (toDownload instanceof Error) {
            throw toDownload;
        }
        const toZip: string[] = [];
        if (format === 'chapitre') {
            if (typeof toDownload !== "number") {
                const links = await inter.fetchChapterLinksBetweenRange(mangaName, toDownload.start, toDownload.end);
                links.forEach((link) => {
                    const attributes = url.getAttributesFromLink(link);
                    const path = inter.getPathFrom(attributes);
                    toZip.push(path);
                });
            } else {
                const path = inter.getPathFrom({ chapter: toDownload.toString(), manga: mangaName, page: "" + 1 });
                toZip.push(path);
            }
        }
        if (format === 'volume') {
            if (typeof toDownload !== "number") {
                for(let i = toDownload.start; i <= toDownload.end; i++){
                    const chapters: string[] = await inter.fetchVolumeChapters(i, mangaName);
                    chapters.forEach((chapter) => {
                        toZip.push(inter.getPathFrom(chapter));
                    });
                }
            } else {
                const chapters: string[] = await inter.fetchVolumeChapters(toDownload, mangaName);
                chapters.forEach((chapter) => {
                    toZip.push(inter.getPathFrom(chapter));
                });
            }
        }
        const isWorthZipping = fsplus.tellIfDoesntExist(toZip);
        if (isWorthZipping) {
            const numberString = (typeof toDownload === "number") ? toDownload.toString() : `${toDownload.start}-${toDownload.end}`;
            await zipper.safeZip(inter, mangaName, format, numberString, toZip);
        }
    }
}
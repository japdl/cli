import fs from "fs";
import CLInterface from "../CLInterface";

import { MangaAttributes } from "./types";
import url from "./url";



const manga = {
    alreadyDownloaded(path: string, isDirectory = true): boolean {
        try {
            const fileStats = fs.lstatSync(path);
            if(isDirectory){
                return fileStats.isDirectory();
            } else {
                return fileStats.isFile();
            }
        } catch (e) {
            return false;
        }
    },
    rmLocations(downloadLocations: string[]): void {
        downloadLocations.forEach((path: string) =>
            fs.rmSync(path, { force: true, recursive: true })
        );
    },
    /**
    * @param param can be a link or manga attributes
    * @returns file name for the page
    */
    getFilenameFrom(
        param:
            | string
            | MangaAttributes
    ): string {
        if (typeof param === "string") {
            return this.getFilenameFrom(url.getAttributesFromLink(param));
        } else {
            return `${param.chapter}_${param.page}.jpg`;
        }
    },
    async handleRange(inter: CLInterface, mangaName: string, format: string, range: string): Promise<{ start: number; end: number; } | number | Error> {
        if (range.includes('-')) {
            const split = range.split(/-+/);
            let start = +split[0];
            if (isNaN(start)) {
                if (split[0] === "debut") {
                    start = 1;
                } else {
                    return new Error(split[0] + " n'est pas un numéro valide, ni 'debut' ou 'fin'");
                }
            }
            let end = +split[1];
            if (isNaN(end)) {
                if (split[1] === "fin") {
                    // if user wants the end of chapters, then total chapters, else total volumes
                    end = (await inter.fetchStats(mangaName))[(format === "chapitre") ? "chapters" : "volumes"];
                } else {
                    return new Error(split[1] + " n'est pas un numéro valide, ni 'debut' ou 'fin'");
                }
            }
            return { start: start, end: end };

        } else {
            if (isNaN(+range)) {
                return new Error(`Le paramètre du numéro (${range}) n'est pas un numéro valide, ni un ensemble`);
            } else {
                return +range;
            }
        }

    }
};

export default manga;
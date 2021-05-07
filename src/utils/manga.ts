import fs from "fs";
import { MangaAttributes } from "./types";
import url from "./url";



const manga = {
    alreadyDownloaded(path: string): boolean {
        let folderExists = false;
        try {
            folderExists = fs.lstatSync(path).isDirectory();
            return folderExists;
        } catch (e) {
            return false;
        }
    },
    rmIfSFlag(args: string[], downloadLocations: string[]): void {
        if (args[3].toLowerCase().includes("s")) {
            downloadLocations.forEach((path: string) =>
                fs.rmSync(path, { force: true, recursive: true })
            );
        }
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
};

export default manga;
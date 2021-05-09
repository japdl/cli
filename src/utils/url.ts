import path from "path";
import { MangaAttributes } from "./types";

const url = {
    joinJapscanURL(...args: string[]): string {
        const website = args.shift();
        return website + "/" + path.posix.join(...args, "/");
    },
    /**
     * @param link link to evaluate
     * @returns manga attributes found from link
     */
    getAttributesFromLink(
        link: string
    ): MangaAttributes {
        const linkSplit = link.split("/");
        const attributes = {
            manga: linkSplit[4],
            chapter: linkSplit[5],
            // This prevents error on a /manga/ page
            page:
                linkSplit[6] === "" || linkSplit[6] === undefined
                    ? "1"
                    : linkSplit[6].replace(".html", ""),
        };
        return attributes;
    },
};

export default url;

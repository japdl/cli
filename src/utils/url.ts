import path from "path";

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
  ): {
    manga: string;
    chapter: string;
    page: string;
  } {
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
  /**
   * @param param can be a link or manga attributes
   * @returns file name for the page
   */
  getFilenameFrom(
    param:
      | string
      | {
          manga: string;
          chapter: string;
          page: string;
        }
  ): string {
    if (typeof param === "string") {
      return this.getFilenameFrom(url.getAttributesFromLink(param));
    } else {
      return `${param.chapter}_${param.page}.jpg`;
    }
  },
};

export default url;

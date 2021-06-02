import { Fetcher } from "japscandl";
import japscandl from "japscandl";
import config from "../src/utils/config";
import flags from "../src/utils/flags";
let fetcher: Fetcher;

describe("Instantiate Fetcher", function () {
    it("Browser instantiation", async function () {
        this.timeout(0);
        const configVariables = config.getConfigVariables();
        const browser = await japscandl.getBrowser(false, configVariables.chromePath);
        fetcher = new Fetcher(browser, { flags: flags.getFlags() });
    });
})
describe("Fetch manga stats tests", function () {
    this.timeout(0);
    it("Fetchs nanatsu-no-taizai volumes, name and chapters", function () {
        const supposedResults = {
            volumes: 41,
            chapters: 347,
            name: "nanatsu-no-taizai",
        };
        return new Promise((resolve, reject) => {
            fetcher.fetchStats("nanatsu-no-taizai").then((infos) => {
                const supposedResultsString = JSON.stringify(supposedResults);
                const infosString = JSON.stringify(infos);
                if (supposedResultsString !== infosString) {
                    reject(
                        "Wrong fetch. Supposed: " +
                        supposedResultsString +
                        "\nGot: " +
                        infosString
                    );
                }
                resolve(undefined);
            });
        });
    });
    it("Fetchs one-piece volume 97 chapters", function () {
        const supposedResults = [
            fetcher.WEBSITE + "/lecture-en-ligne/one-piece/976/",
            fetcher.WEBSITE + "/lecture-en-ligne/one-piece/977/",
            fetcher.WEBSITE + "/lecture-en-ligne/one-piece/978/",
            fetcher.WEBSITE + "/lecture-en-ligne/one-piece/979/",
            fetcher.WEBSITE + "/lecture-en-ligne/one-piece/980/",
            fetcher.WEBSITE + "/lecture-en-ligne/one-piece/981/",
            fetcher.WEBSITE + "/lecture-en-ligne/one-piece/982/",
            fetcher.WEBSITE + "/lecture-en-ligne/one-piece/983/",
            fetcher.WEBSITE + "/lecture-en-ligne/one-piece/984/",
            fetcher.WEBSITE + "/lecture-en-ligne/one-piece/985/",
            fetcher.WEBSITE + "/lecture-en-ligne/one-piece/986/",
        ];
        return new Promise((resolve, reject) => {
            const supposedResultsString = supposedResults.toString();
            fetcher.fetchVolumeChapters(97, "one-piece").then((chapters) => {
                const chaptersToString = chapters.toString();
                if (chaptersToString !== supposedResultsString) {
                    reject(
                        "Wrong fetch. Supposed: " +
                        supposedResultsString +
                        "\nGot: " +
                        chaptersToString
                    );
                }
                resolve(undefined);
            });
        });
    });
    it("Fetchs one-piece chapter ${chapterToDownload} pages", function () {
        const supposedResult = 15;
        return new Promise((resolve, reject) => {
            fetcher
                .fetchNumberOfPagesInChapter(
                    fetcher.WEBSITE + "/lecture-en-ligne/one-piece/1000/"
                )
                .then((numberOfPages) => {
                    if (supposedResult !== numberOfPages) {
                        reject(
                            "Wrong fetch. Supposed: " +
                            supposedResult +
                            "\nGot: " +
                            numberOfPages
                        );
                    }
                    resolve(undefined);
                });
        });
    });
    it("Fetchs range between one-piece 1000 and 1005", function () {
        const supposedLinks = [
            fetcher.WEBSITE + "/lecture-en-ligne/one-piece/1000/",
            fetcher.WEBSITE + "/lecture-en-ligne/one-piece/1000.5/",
            fetcher.WEBSITE + "/lecture-en-ligne/one-piece/1001/",
            fetcher.WEBSITE + "/lecture-en-ligne/one-piece/1002/",
            fetcher.WEBSITE + "/lecture-en-ligne/one-piece/1003/",
            fetcher.WEBSITE + "/lecture-en-ligne/one-piece/1004/",
            fetcher.WEBSITE + "/lecture-en-ligne/one-piece/1005/",
        ];
        const supposedLinksToString = supposedLinks.toString();
        return new Promise((resolve, reject) => {
            fetcher
                .fetchChapterLinksBetweenRange("one-piece", 1000, 1005)
                .then((links) => {
                    const linksToString = links.toString();
                    if (linksToString !== supposedLinksToString) {
                        reject(
                            "Wrong fetch. Supposed: " +
                            supposedLinksToString +
                            "\nGot: " +
                            linksToString
                        );
                    } else {
                        resolve(undefined);
                    }
                });
        });
    });
    it("Should throw because range is invalid", function () {
        return new Promise((resolve, reject) => {
            fetcher
                .fetchChapterLinksBetweenRange("one-piece", 1005, 1004)
                .then((links) =>
                    reject(
                        "Was supposed to throw because invalid, got links: " +
                        links.toString()
                    )
                )
                .catch((error) => resolve(error));
        });
    });
});
describe("japscan 404 tests", function () {
    it("Should throw because page is 404", function () {
        return new Promise((resolve, reject) => {
            fetcher
                .createExistingPage(fetcher.WEBSITE + "/manga/one-piece")
                .catch((error) => reject(error));
            resolve(undefined);
        });
    });
    it("Should not throw because page exists", function () {
        return new Promise((resolve, reject) => {
            fetcher
                .createExistingPage(fetcher.WEBSITE + "/manga/one-piece/")
                .catch((error) => reject(error));
            resolve(undefined);
        });
    });
});

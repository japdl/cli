import Downloader from "../src/Downloader";
import fs from "fs";
import path from "path";
import sizeOf from "image-size";

let downloader: Downloader;

describe("Downloader tests", function () {
    it("Downloader instantiation", function () {
        this.timeout(0);
        downloader = new Downloader({onPage: (attributes, current, total) => console.log(`${attributes.manga} ${attributes.chapter} ${current}/${total}`)});
        return downloader.onready;
    });
});
describe("Downloading one-piece chapter 999", function () {
    it("download one piece chapter 999", function () {
        this.timeout(1000 * 60 * 5); // 5 minutes
        return new Promise((resolve, reject) => {
            downloader
                .downloadChapter("one-piece", 999)
                .then(() => resolve(undefined))
                .catch((error) => reject(error));
        });
    });
    it("number of open chrome pages must be all about:blank", async function () {
        return new Promise(function (resolve, reject) {
            downloader.browser.pages().then((pages) => {
                const pagesUrl: string[] = [];
                pages.forEach((page) => pagesUrl.push(page.url()));
                const pagesThatAreNotBlank = pagesUrl.filter(
                    (url) => url !== "about:blank"
                );
                if (pagesThatAreNotBlank.length) {
                    reject("Some pages are not closed:" + pagesThatAreNotBlank);
                } else {
                    resolve();
                }
            });
        });
    });
    it("folder one-piece/999 must exist", function () {
        const folderPath = path.join(
            downloader.outputDirectory,
            "one-piece",
            "999"
        );
        if (!fs.existsSync(folderPath)) {
            throw new Error(
                "Folder " + folderPath + " was not created after download"
            );
        }
    });
    it("downloaded One Piece must have 16 pages", function () {
        const downloadedAt = path.join(
            downloader.outputDirectory,
            "one-piece",
            "999"
        );
        const numberOfImages = fs.readdirSync(downloadedAt).length;
        if (numberOfImages !== 16) {
            throw new Error(
                "There must be 16 images, " + numberOfImages + " were found"
            );
        }
    });
    it("cbr must have been created", function () {
        const cbrName = downloader.getCbrFrom("one-piece", "999", "chapitre");
        if (!fs.existsSync(cbrName)) {
            throw new Error("cbr was not created at " + cbrName);
        }
    });
    it("Page 13 must have correct size", function () {
        const { height, width } = sizeOf(
            path.join(__dirname, "../../manga/one-piece/999/999_13.jpg")
        );
        const supposedHeight = 1300;
        const supposedWidth = 1769;
        const errors: string[] = [];
        if (height !== supposedHeight) {
            errors.push(
                `height is wrong, current: ${height}, supposed: ${supposedHeight}`
            );
        }
        if (width !== supposedWidth) {
            errors.push(
                `width is wrong, current: ${width}, supposed: ${supposedWidth}`
            );
        }
        if (errors.length) {
            throw new Error(errors.join("\n"));
        }
    });
});
describe("Fetch manga stats tests", function () {
    this.timeout(0);
    it("Fetchs nanatsu-no-taizai volumes, name and chapters", function () {
        const supposedResults = {
            volumes: 41,
            chapters: 347,
            name: "nanatsu-no-taizai",
        };
        return new Promise((resolve, reject) => {
            downloader.fetchStats("nanatsu-no-taizai").then((infos) => {
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
            "https://www.japscan.se/lecture-en-ligne/one-piece/976/",
            "https://www.japscan.se/lecture-en-ligne/one-piece/977/",
            "https://www.japscan.se/lecture-en-ligne/one-piece/978/",
            "https://www.japscan.se/lecture-en-ligne/one-piece/979/",
            "https://www.japscan.se/lecture-en-ligne/one-piece/980/",
            "https://www.japscan.se/lecture-en-ligne/one-piece/981/",
            "https://www.japscan.se/lecture-en-ligne/one-piece/982/",
            "https://www.japscan.se/lecture-en-ligne/one-piece/983/",
            "https://www.japscan.se/lecture-en-ligne/one-piece/984/",
            "https://www.japscan.se/lecture-en-ligne/one-piece/985/",
            "https://www.japscan.se/lecture-en-ligne/one-piece/986/",
        ];
        return new Promise((resolve, reject) => {
            const supposedResultsString = supposedResults.toString();
            downloader.fetchVolumeChapters(97, "one-piece").then((chapters) => {
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
    it("Fetchs one-piece chapter 999 pages", function () {
        const supposedResult = 15;
        return new Promise((resolve, reject) => {
            downloader
                .fetchNumberOfPagesInChapter(
                    "https://www.japscan.se/lecture-en-ligne/one-piece/1000/"
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
            "https://www.japscan.se/lecture-en-ligne/one-piece/1000/",
            "https://www.japscan.se/lecture-en-ligne/one-piece/1000.5/",
            "https://www.japscan.se/lecture-en-ligne/one-piece/1001/",
            "https://www.japscan.se/lecture-en-ligne/one-piece/1002/",
            "https://www.japscan.se/lecture-en-ligne/one-piece/1003/",
            "https://www.japscan.se/lecture-en-ligne/one-piece/1004/",
            "https://www.japscan.se/lecture-en-ligne/one-piece/1005/",
        ];
        const supposedLinksToString = supposedLinks.toString();
        return new Promise((resolve, reject) => {
            downloader
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
            downloader
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
            downloader
                .goToExistingPage("https://www.japscan.se/manga/one-piece")
                .catch((error) => reject(error));
            resolve(undefined);
        });
    });
    it("Should not throw because page exists", function () {
        return new Promise((resolve, reject) => {
            downloader
                .goToExistingPage("https://www.japscan.se/manga/one-piece/")
                .catch((error) => reject(error));
            resolve(undefined);
        });
    });
});

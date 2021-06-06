import fs from "fs";
import path from "path";
import sizeOf from "image-size";
import japscandl from "japscandl";
import config from "../src/utils/config";
import { Downloader } from "japscandl";
import flags from "../src/utils/flags";
import chrome from "../src/utils/chrome";

let downloader: Downloader;

const mangaToDownload = "one-piece";
const chapterToDownload = 998;
const numberOfPages = 11;

describe("Downloader tests", function () {
    it("Browser instantiation", async function () {
        this.timeout(0);
        const configVariables = config.getConfigVariables();
        const browser = await japscandl.getBrowser(false, chrome.getChromePath(configVariables.chromePath));
        const f = flags.getFlags();
        downloader = new Downloader(browser, {
            onEvent: {
                onPage: (attributes, totalPages) => {
                    const { manga, chapter, page } = attributes;
                    console.log(`${manga} ${chapter} ${page}/${totalPages}`);
                }
            },
            flags: f
        });
    });
    describe(`Downloading ${mangaToDownload} chapter ${chapterToDownload}`, function () {
        this.afterEach("number of open chrome pages must be all about:blank", async function () {
            return new Promise(function (resolve, reject) {
                downloader.browser.pages().then((pages) => {
                    const pagesUrl: string[] = [];
                    pages.forEach((page) => pagesUrl.push(page.url()));
                    const pagesThatAreNotBlank = pagesUrl.filter(
                        (url) => url !== "about:blank"
                    );
                    if (pagesThatAreNotBlank.length) {
                        reject("Some pages are not closed:" + pagesThatAreNotBlank.join('\n'));
                    } else {
                        resolve();
                    }
                });
            });
        });
        it(`download ${mangaToDownload} chapter ${chapterToDownload}`, function () {
            this.timeout(1000 * 60 * 5); // 5 minutes
            return new Promise((resolve, reject) => {
                downloader
                    .downloadChapter(mangaToDownload, chapterToDownload)
                    .then(() => resolve(undefined))
                    .catch((error) => reject(error));
            });
        });
        it(`folder ${mangaToDownload}/${chapterToDownload} must exist`, function () {
            const folderPath = path.join(
                downloader.outputDirectory,
                mangaToDownload,
                chapterToDownload.toString()
            );
            if (!fs.existsSync(folderPath)) {
                throw new Error(
                    "Folder " + folderPath + " was not created after download"
                );
            }
        });
        it(`downloaded One Piece must have ${numberOfPages} pages`, function () {
            const downloadedAt = path.join(
                downloader.outputDirectory,
                "one-piece",
                "998"
            );
            const numberOfImages = fs.readdirSync(downloadedAt).length;
            if (numberOfImages !== numberOfPages) {
                throw new Error(
                    "There must be " + numberOfPages + " images, " + numberOfImages + " were found"
                );
            }
        });
        it("cbr must have been created", function () {
            const cbrName = downloader._getCbrFrom(mangaToDownload, chapterToDownload.toString(), "chapitre");
            if (!fs.existsSync(cbrName)) {
                throw new Error("cbr was not created at " + cbrName);
            }
        });
        const pageToCheck = 4;
        it(`Page ${pageToCheck} must have correct size`, function () {
            const { height, width } = sizeOf(
                path.join(__dirname, `../../manga/one-piece/${chapterToDownload}/${chapterToDownload}_${pageToCheck}.jpg`)
            );
            const supposedHeight = 1300;
            const supposedWidth = 1790;
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

});
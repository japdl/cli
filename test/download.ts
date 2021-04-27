import Downloader from "../src/downloader";
import fs from "fs";
import path from "path";

let downloader: Downloader;

describe("Downloader tests", function () {
  it("Downloader instantiation", function () {
    this.timeout(0);
    downloader = new Downloader();
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
    const cbrName = downloader.getCbrFrom("one-piece", 999, "chapitre");
    if (!fs.existsSync(cbrName)) {
      throw new Error("cbr was not created at " + cbrName);
    }
  });
});

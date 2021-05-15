/* eslint-disable @typescript-eslint/ban-ts-comment */
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import config from "./utils/config";
import chrome from "./utils/chrome";
import path from "path";

puppeteer
    .use(StealthPlugin())
    .use(AdblockerPlugin({ blockTrackers: true }));
(async () => {
    const configVariables = config.getConfigVariables();
    const outputDirectory = configVariables.outputDirectory;
    const chromePath = chrome.getChromePath(configVariables.chromePath);
    const browser = await puppeteer.launch({
        executablePath: chromePath,
        devtools: true,
        headless: false,
    });
    // the page I want to debug
    const myPage = await browser.newPage();
    const fn = await import(path.join(__dirname, "inject/inject.js"));
    console.log(fn.default);
    await myPage.evaluateOnNewDocument(fn.default);
    //@ts-ignore
    await myPage.goto('https://japscan.ws/lecture-en-ligne/one-piece/998/');
    console.log("Done");

})();
import { Browser } from "puppeteer";
import path from "path";
// utils
import { ComponentFlags, DownloaderOnChapter, DownloaderOnPage, DownloaderOnVolume } from "./utils/types";
import zipper from "./utils/zipper";
import url from "./utils/url";
import fsplus from "./utils/fsplus";
import manga from "./utils/manga";
import Fetcher from "./Fetcher";


/**
 * Japscan downloader class, usually used with an interface
 */
class Downloader extends Fetcher {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onPage: DownloaderOnPage = () => { };
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onChapter: DownloaderOnChapter = () => { };
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onVolume: DownloaderOnVolume = () => { };

    /**
     * Instantiates a browser and reads config file to get output directory
     * and chrome path
     * @param options Can take definitions of onEvent callbacks, default are empty callbacks
     */
    constructor(browser: Browser, parameters: ComponentFlags & {
        outputDirectory: string;
    }, options?: {
        onPage?: DownloaderOnPage,
        onChapter?: DownloaderOnChapter
        onVolume?: DownloaderOnVolume;
    }) {
        super(browser, parameters);
        // managing options
        if (options) {
            for (const option of Object.entries(options)) {
                // this[options[0]] becomes this.onPage, this.onChapter and this.onVolume
                // option[1] is the function given
                // @ts-ignore
                this[option[0]] = option[1];
            }
        }
        // flags
        if (parameters.fast) {
            console.log(
                "Attention! Le flag 'fast' est activé. Le programme ne garantit plus de récupérer toutes les images des chapitres. Une bonne connexion et un bon ordinateur est très fortement recommandé pour l'utilisation de ce flag. Dans le cas contraire, des images pourraient manquer."
            );
        }
    }

    /**
     * @param mangaName manga name
     * @param chapter number of chapter
     * @param compression default as false, tells if chapter is compressed as a cbr after downloading
     * @returns download location
     */
    async downloadChapter(mangaName: string, chapter: number, compression = true): Promise<string> {
        this.verbosePrint(console.log,
            "Téléchargement du chapitre " + chapter + " de " + mangaName
        );
        const mangaNameStats = (await this.fetchStats(mangaName)).name;
        if (mangaName !== mangaNameStats) {
            console.log(
                "Le manga " +
                mangaName +
                " est appelé " +
                mangaNameStats +
                " sur japscan. japdl va le télécharger avec le nom " +
                mangaNameStats
            );
        }
        mangaName = mangaNameStats;
        const link = url.joinJapscanURL(
            this.WEBSITE,
            "lecture-en-ligne",
            mangaName,
            chapter.toString()
        );
        return this.downloadChapterFromLink(link, compression);
    }

    /**
     * @param mangaName manga name
     * @param start start chapter
     * @param end end chapter
     * @param compression default as false, tells if chapter is compressed as a cbr after downloading
     * @returns download locations as an array
     */
    async downloadChapters(
        mangaName: string,
        start: number,
        end: number,
        compression = true
    ): Promise<string[]> {
        this.verbosePrint(console.log,
            "Téléchargement des chapitres de " +
            mangaName +
            " de " +
            start +
            " à " +
            end
        );
        const chapterDownloadLocations: Array<string> = [];
        const linksToDownload = await this.fetchChapterLinksBetweenRange(
            mangaName,
            start,
            end
        );
        this.verbosePrint(console.log, "Liens à télécharger: ", linksToDownload);
        let i = 1;
        for (const link of linksToDownload) {
            chapterDownloadLocations.push(await this.downloadChapterFromLink(link, compression));
            this.onChapter(url.getAttributesFromLink(link), i++, linksToDownload.length);
        }
        return chapterDownloadLocations;
    }

    /**
     * @param link link to download from
     * @param compression default as false, tells if chapter is compressed as a cbr after downloading
     * @returns chapter's download location
     */
    async downloadChapterFromLink(
        link: string,
        compression = false
    ): Promise<string> {
        this.verbosePrint(console.log, "Téléchargement du chapitre depuis le lien " + link);
        const startAttributes = url.getAttributesFromLink(link);
        const numberOfPages = await this.fetchNumberOfPagesInChapter(link);

        const couldNotDownload: string[] = [];
        this.onPage(startAttributes, 0, numberOfPages);
        for (let i = 1; i <= numberOfPages; i++) {
            const pageLink = `${link}${i}.html`;
            const isDownloaded = await this.downloadImageFromLink(pageLink);
            if (!isDownloaded) {
                couldNotDownload.push(pageLink);
            }
            this.onPage(url.getAttributesFromLink(link), i, numberOfPages);

        }

        if (couldNotDownload.length > 0) {
            if (couldNotDownload.length > 1) {
                console.log(
                    "Les chapitres aux liens suivants n'ont pas pu être téléchargé:",
                    couldNotDownload
                );
                console.log(
                    "Peut être que ces liens n'ont pas d'image. Veuillez vérifier."
                );
            } else {
                console.log(
                    "Le chapitre au lien suivant n'a pas pu être téléchargé:",
                    couldNotDownload[0]
                );
                console.log(
                    "Peut être que ce lien n'a pas d'image. Veuillez vérifier."
                );
            }
        }

        if (compression) {
            await zipper.safeZip(this, startAttributes.manga, "chapitre", startAttributes.chapter, [this.getPathFrom(startAttributes)]);
        }
        return this.getPathFrom(startAttributes);
    }

    /**
     * @param link link to download from
     * @returns if image could be downloaded
     */
    async downloadImageFromLink(link: string): Promise<boolean> {
        this.verbosePrint(console.log, "Téléchargement de l'image depuis le lien " + link);
        const page = await this.goToExistingPage(link, true);

        const attributes = url.getAttributesFromLink(link);

        let savePath = path.posix.join(
            this.outputDirectory,
            attributes.manga,
            attributes.chapter
        );
        fsplus.createPath(savePath);
        savePath = path.posix.join(savePath, manga.getFilenameFrom(attributes));
        const popupCanvasSelector = "body > canvas";
        try {
            this.verbosePrint(console.log, "Attente du script de page...");
            await page.waitForSelector(popupCanvasSelector, {
                timeout: this.timeout,
            });
            this.verbosePrint(console.log, "Attente terminée");
        } catch (e) {
            console.log("Cette page n'a pas l'air d'avoir d'images");
            await page.close();
            return false;
        }

        const canvasElement = await page.$(popupCanvasSelector);
        let dimensions = await canvasElement?.evaluate((el) => {
            const width = el.getAttribute("width");
            const height = el.getAttribute("height");
            if (width !== null && height !== null) {
                return {
                    width: parseInt(width) * 2,
                    height: parseInt(height) * 2,
                };
            }
            return {
                width: 4096,
                height: 2160,
            };
        });
        if (!dimensions) {
            dimensions = {
                width: 4096,
                height: 2160,
            };
        }
        await page.setViewport(dimensions);

        // remove everything from page except canvas
        await page.evaluate(() => {
            document.querySelectorAll("div").forEach((el) => el.remove());
        });
        this.verbosePrint(console.log, "Téléchargement de l'image...");
        await canvasElement
            ?.screenshot({
                omitBackground: true,
                path: savePath,
                type: "jpeg",
                quality: 100,
            })
            .catch((e) => console.log("Erreur dans la capture de l'image", e));
        page.close();
        return true;
    }
    /**
     * @param mangaName manga name
     * @param start start chapter
     * @param end end chapter
     * @param compression default as false, tells if chapter is compressed as a cbr after downloading
     * @returns array of download locations for each volume
     */
    async downloadVolumes(
        mangaName: string,
        start: number,
        end: number,
        compression = true
    ): Promise<string[][]> {
        this.verbosePrint(console.log,
            "Téléchargement des volumes " + mangaName + " de " + start + " à " + end
        );
        if (start > end) {
            throw new Error("Le début ne peut pas être plus grand que la fin");
        }
        const volumeDownloadLocations: Array<Array<string>> = [];
        for (let i = start; i <= end; i++) {
            const downloadLocations = await this.downloadVolume(mangaName, i, compression);
            volumeDownloadLocations.push(downloadLocations);
            this.onVolume(mangaName, i, end - start);
        }
        return volumeDownloadLocations;
    }

    /**
     *
     * @param mangaName manga name
     * @param volumeNumber volume number
     * @param compression default as true, tells if volume is compressed as a cbr after downloading
     * @returns array of paths, where the chapters of the volume were downloaded
     */
    async downloadVolume(
        mangaName: string,
        volumeNumber: number,
        compression = true
    ): Promise<string[]> {
        console.log(
            "Téléchargement du volume " + volumeNumber + " de " + mangaName
        );
        const stats = await this.fetchStats(mangaName);
        if (stats.name !== mangaName) {
            console.log(
                "Le manga " +
                mangaName +
                " est appelé " +
                stats.name +
                " sur japscan. japdl va le télécharger avec le nom " +
                stats.name
            );
            mangaName = stats.name;
        }
        this.verbosePrint(console.log, "Récupération des informations sur le volume...");

        const toDownloadFrom = await this.fetchVolumeChapters(
            volumeNumber,
            mangaName
        );

        this.verbosePrint(console.log, "Récupéré");
        const waiters = [];
        const downloadLocations: Array<string> = [];
        let i = 1;
        for (const link of toDownloadFrom) {
            // should return path of download
            const chapterPromise = this.downloadChapterFromLink(link);
            if (this.fast) {
                waiters.push(chapterPromise);
            } else {
                downloadLocations.push(await chapterPromise);
                this.onChapter(url.getAttributesFromLink(link), i++, toDownloadFrom.length);
            }
        }

        if (this.fast) {
            for (const waiter of waiters) {
                downloadLocations.push(await waiter);
            }
        }
        if (compression) {
            await zipper.safeZip(this, mangaName, "volume", volumeNumber.toString(), downloadLocations);
        }
        return downloadLocations;
    }

    /**
     * destroy browser, do not use downloader after this operation
     */
    async destroy(): Promise<void> {
        this.verbosePrint(console.log, "Destruction du downloader");
        if (this.browser) await this.browser.close();
    }

    /**
     * NOT YET IMPLEMENTED
     * @param link to download from
     */
    async downloadWebtoon(link: string): Promise<void> {
        const page = await this.goToExistingPage(link);
        await page.waitForTimeout(5000);
        const image = await page.$("#image");
        if (image === null) return;
        const a = await image.$$("a > div");
        if (a === null) return;
        a.forEach((pel) => pel.evaluate((el) => document.body.appendChild(el)));
        page.evaluate(() => {
            document
                .querySelectorAll("body > div.container")
                .forEach((el) => el.remove());
        });
        for (const el of a) {
            const id = await el.evaluate((el) => el.id);
            el.screenshot({
                path: path.join(process.cwd(), "manga", "solo-leveling-" + id + ".jpg"),
            });
        }
    }
}

export default Downloader;

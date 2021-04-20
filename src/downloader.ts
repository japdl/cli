import { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";

import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import utils from "./utils";

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

/**
 * Japscan downloader class, usually used with an interface (that you can make)
 */
class Downloader {
    WEBSITE = "https://www.japscan.se";
    browser!: Browser;
    outputDirectory!: string;
    onready: Promise<undefined>;
    chromePath!: string;
    verbose: boolean;

    /**
     * Instantiates a browser and reads config file to get output directory
     * and chrome path
     */
    constructor(flags?: Record<string, boolean>) {
        let headless: boolean;
        if(flags !== undefined){
            this.verbose = flags.v;
            headless = !flags.h;
        } else {
            this.verbose = false;
            headless = true;
        }
        const variables = utils.path.getConfigVariables();
        this.chromePath = utils.path.getChromePath(variables.chromePath);
        this.outputDirectory = variables.outputDirectory;
        this.onready = new Promise((resolve, reject) => {
            puppeteer
                .launch({
                    headless: headless,
                    executablePath: this.chromePath,
                })
                .then((browser) => {
                    this.browser = browser;
                    resolve(undefined);
                })
                .catch((e) => {
                    if(e.toString().includes("FetchError")){
                        reject("Une erreur s'est produite, vérifiez que vous avez bien une connexion internet");
                    } else if(e.toString().includes("Failed to launch the browser process!")){
                        reject("Le chemin de chrome donné (" + this.chromePath +") n'est pas correct");
                    }
                    reject("Une erreur s'est produite lors de l'initialisation: " + e);
                });
        });
    }
    // helpers

    /** if page exists, go to it, else throw error
     * @param link link to go to
     * @returns a valid japscan page
     */
    async goToExistingPage(link: string): Promise<Page> {
        const page = await this.browser.newPage();
        await page.goto(link);
        if (await this.isJapscan404(page)) {
            throw "La page " + link + " n'existe pas (404)";
        }
        this.verbosePrint("Création de la page " + link);
        return page;
    }

    /**
     * @param page page to evaluate
     * @returns true if link it not a good link and false if the link is right
     */
    async isJapscan404(page: Page): Promise<boolean> {
        try {
            return await page.$eval("div.container:nth-child(2) > h1:nth-child(1)", (element: Element) => element.innerHTML) === "Oops!";
        } catch (e) {
            return false;
        }
    }

    /**
     * @param link link to evaluate
     * @returns manga attributes found from link
     */
    getAttributesFromLink(link: string): MangaAttributes {
        if (link[link.length - 1] != "/") {
            link += "/";
        }
        const linkSplit = link.split("/");
        const attributes: MangaAttributes = {
            manga: linkSplit[4],
            chapter: linkSplit[5],
            // This prevents error on a /manga/ page
            page: (linkSplit[6] === "" || linkSplit[6] === undefined) ? "1" : linkSplit[6].replace(".html", ""),
        };
        return attributes;
    }

    /**
     * @param param can be a link or manga attributes
     * @returns file name for the page
     */
    getFilenameFrom(param: string | MangaAttributes): string {
        if (typeof param === "string") {
            return this.getFilenameFrom(this.getAttributesFromLink(param));
        } else {
            return `${param.chapter}_${param.page}.jpg`;
        }
    }

    /**
     * 
     * @param param can be a link or manga attributes
     * @returns path to manga without filename
     */
    getPathFrom(param: string | MangaAttributes): string {
        if (typeof param === "string") {
            return this.getPathFrom(this.getAttributesFromLink(param));
        } else {
            return `${this.outputDirectory}/${param.manga}/${param.chapter}/`;
        }
    }

    /**
     * 
     * @param manga manga name
     * @param number number of volume or chapter
     * @param type usually 'volume' or 'chapitre'
     * @returns cbr name
     */
    getCbrFrom(manga: string, number: number, type: string): string {
        return `${this.outputDirectory}/${manga}/${manga}-${type}-${number}.cbr`;
    }

    /**
     * @param mangaName manga name
     * @param chapter number of chapter
     * @returns download location
     */
    async downloadChapter(mangaName: string, chapter: number): Promise<string> {
        this.verbosePrint("Téléchargement du chapitre " + chapter +  " de " + mangaName);
        const mangaNameStats = (await this.fetchStats(mangaName)).name;
        if (mangaName !== mangaNameStats) {
            console.log("Le manga " + mangaName + " est appelé " + mangaNameStats + " sur japscan. japdl va le télécharger avec le nom " + mangaNameStats);
        }
        mangaName = mangaNameStats;
        const link =
            this.WEBSITE + "/lecture-en-ligne/" + mangaName + "/" + chapter + "/";
        return this.downloadChapterFromLink(link, true);
    }

    /**
     * @param mangaName manga name
     * @param start start chapter
     * @param end end chapter
     * @returns download locations as an array
     */
    async downloadChapters(mangaName: string, start: number, end: number): Promise<string[]> {
        this.verbosePrint("Téléchargement des chapitres de " + mangaName + " de " + start + " à " + end);
        if (start > end) {
            throw "Le début ne peut pas être plus grand que la fin";
        }
        const waiters: Promise<string>[] = [];
        const chapterDownloadLocations: Array<string> = [];
        for (let i = start; i <= end; i++) {
            // Should return array of path it downloaded it in
            waiters.push(this.downloadChapter(mangaName, i));
        }
        for (const waiter of waiters) {
            const downloadLocation = await waiter;
            chapterDownloadLocations.push(downloadLocation);
        }
        return chapterDownloadLocations;
    }

    /**
     * @param link link to download from
     * @param compression default as false, tells if chapter is compressed as a cbr after downloading
     * @returns 
     */
    async downloadChapterFromLink(link: string, compression = false): Promise<string> {
        this.verbosePrint("Téléchargement du chapitre depuis le lien " + link);
        const startAttributes = this.getAttributesFromLink(link);
        let attributes;
        do {
            link = await this.downloadImageFromLink(link);
            attributes = this.getAttributesFromLink(link);
        } while (attributes.chapter === startAttributes.chapter);
        console.log("Le chapitre " + startAttributes.chapter + " a bien été téléchargé");
        if (compression) {
            await utils.zipper.zipDirectories(
                [this.getPathFrom(startAttributes)],
                this.getCbrFrom(startAttributes.manga, parseInt(startAttributes.chapter), "chapitre"));
        }
        return this.getPathFrom(startAttributes);
    }

    /**
     * @param link link to download from
     * @returns next page link
     */
    async downloadImageFromLink(link: string): Promise<string> {
        this.verbosePrint("Téléchargement de l'image depuis le lien " + link);
        function createPath(_path: string) {
            const split = _path.split("/");
            let path = "";
            split.forEach((folder: string) => {
                if (folder === "") return;
                path += folder + "/";
                utils.path.mkdirIfDoesntExist(path);
            });
        }

        const page = await this.goToExistingPage(link);
        await page.addScriptTag({
            content: utils.inject,
        });

        const popupCanvasSelector = "body > canvas";
        try {
            this.verbosePrint("Attente du script de page...");
            await page.waitForSelector(popupCanvasSelector, { timeout: 20000 });
            this.verbosePrint("Attente terminée");
        } catch (e) {
            console.log(
                "Une erreur s'est produite pour la page " +
                link +
                ", japdl va réessayer"
            );
            await page.close();
            return await this.downloadImageFromLink(link);
        }
        // get next link
        this.verbosePrint("Récupération du lien de la page suivante");
        const element = await page.$("#image");
        const nextLink = await element?.evaluate((e) =>
            e.getAttribute("data-next-link")
        );
        if (!nextLink) {
            throw "Le lien vers la page suivante n'a pas été trouvé sur la page " + link;
        }

        // remove elements on page
        const attributes = this.getAttributesFromLink(link);

        let path = this.outputDirectory + "/" + attributes.manga + "/" + attributes.chapter + "/";
        createPath(path);
        path += this.getFilenameFrom(attributes);
        const canvasElement = await page.$(popupCanvasSelector);
        let dimensions = await canvasElement?.evaluate((el) => {
            const width = el.getAttribute('width');
            const height = el.getAttribute('height');
            if (width !== null && height !== null) {
                return {
                    width: parseInt(width) * 2,
                    height: parseInt(height) * 2
                }
            }
            return {
                width: 4096,
                height: 2160
            }
        });
        if (dimensions === undefined) {
            dimensions = {
                width: 4096,
                height: 2160
            };
        }
        await page.setViewport(dimensions);
        // remove everything from page except canvas
        await page.evaluate(() => {
            document.querySelectorAll('div').forEach((el) => el.remove());
        });
        this.verbosePrint("Téléchargement de l'image...");
        await canvasElement?.screenshot({
            omitBackground: true,
            path: path,
            type: "jpeg",
            quality: 100,
        }).catch((e) => console.log("Erreur dans la capture de l'image", e));
        console.log(path + " téléchargé");
        await page.close();

        return this.WEBSITE + nextLink;
    }

    /**
     * 
     * @param mangaName manga name
     * @param start start volume
     * @param end end volume
     * @returns array of array of paths, where the volumes were downloaded
     */
    async downloadVolumes(mangaName: string, start: number, end: number): Promise<string[][]> {
        this.verbosePrint("Téléchargement des volumes " + mangaName + " de " + start + " à " + end);
        if (start > end) {
            throw "Le début ne peut pas être plus grand que la fin";
        }
        const volumeDownloadLocations: Array<Array<string>> = [];
        for (let i = start; i <= end; i++) {
            const downloadLocations = await this.downloadVolume(mangaName, i);
            volumeDownloadLocations.push(downloadLocations);
        }
        return volumeDownloadLocations;
    }

    /**
     * 
     * @param mangaName manga name
     * @param volumeNumber volume number
     * @returns array of paths, where the chapters of the volume were downloaded
     */
    async downloadVolume(mangaName: string, volumeNumber: number): Promise<string[]> {
        console.log("Téléchargement du volume " + volumeNumber + " de " + mangaName);
        const stats = await this.fetchStats(mangaName);
        if (stats.name !== mangaName) {
            console.log("Le manga " + mangaName + " est appelé " + stats.name + " sur japscan. japdl va le télécharger avec le nom " + stats.name);
            mangaName = stats.name;
        }
        this.verbosePrint("Récupération des informations sur le volume...");

        const toDownloadFrom = await this.fetchVolumeChapters(
            volumeNumber,
            mangaName
        );

        this.verbosePrint("Récupéré");

        const waiters = [];
        const downloadLocations: Array<string> = [];
        for (const link of toDownloadFrom) {
            this.verbosePrint("Téléchargement de " + link);
            // should return path of download
            waiters.push(this.downloadChapterFromLink(link));
        }

        for (const waiter of waiters) {
            downloadLocations.push(await waiter);
        }
        const cbrName = this.getCbrFrom(mangaName, volumeNumber, "volume");
        console.log("En train de faire le cbr " + mangaName + " volume " + volumeNumber + "...");
        await utils.zipper.zipDirectories(
            downloadLocations,
            cbrName
        ).catch((e) => console.log("Erreur pendant la création du cbr:", e));
        console.log("Cbr terminé! Il est enregistré à l'endroit " + cbrName);
        return downloadLocations;
    }
    /**
     * 
     * @param mangaName manga name
     * @param _page page you already have opened to prevent waiting for page initialisation
     * @returns manga stats
     */
    async fetchStats(mangaName: string, _page?: Page): Promise<MangaStats> {
        this.verbosePrint("Récupération des infos du manga " + mangaName);
        const link = this.WEBSITE + "/manga/" + mangaName + "/";

        const page = _page || (await this.goToExistingPage(link));
        const pageMangaName = this.getAttributesFromLink(page.url()).manga;
        const chapterList = await page.$("#chapters_list");
        const volumes = await chapterList?.$$("h4");
        const lastChapterLink = await chapterList?.$eval(".collapse", (el) => {
            const div = el.querySelector('div');
            if (div !== null) {
                const a = div.querySelector('a');
                if (a !== null) {
                    return a.href;
                }
            }
        });

        if (lastChapterLink === undefined || lastChapterLink === null) {
            throw "japdl n'a pas pu récupérer les infos de " + mangaName + ", ce manga ne se trouve pas à ce nom sur japscan";
        }
        if (volumes === undefined) {
            throw "japdl n'a pas pu trouver la liste des chapitres sur la page du manga " + mangaName;
        }
        if (!_page) {
            page.close();
        }
        const chapter = this.getAttributesFromLink(lastChapterLink).chapter;
        return { volumes: volumes?.length, chapters: parseInt(chapter), name: pageMangaName };
    }

    async fetchVolumeChapters(
        volumeNumber: number,
        mangaName: string
    ): Promise<Array<string>> {
        this.verbosePrint("Récupération des chapitres du volume" + volumeNumber + " du manga " + mangaName);
        const link = this.WEBSITE + "/manga/" + mangaName + "/";

        const page = await this.goToExistingPage(link);
        const chapterList = await page.$("#chapters_list");
        const numberOfVolumes = (await this.fetchStats(mangaName, page)).volumes;

        if (volumeNumber > numberOfVolumes || volumeNumber <= 0) {
            throw `Le numéro de volume (${volumeNumber}) ne peut pas être plus grand que le nombre actuel de volumes (${numberOfVolumes}) ou moins de 1`
        }

        const chapters = await chapterList?.$$(".collapse");
        if (chapters === undefined) {
            throw "Le programme n'a pas pu accéder au contenu du volume " + volumeNumber;
        }
        try {
            const volumeLinks = await chapters[chapters.length - volumeNumber].evaluate(
                (el: Element) => {
                    const result: Array<string> = [];
                    el.querySelectorAll("div").forEach((el) => {
                        const aElement = el.querySelector('a');
                        if (aElement === null) {
                            result.push("https://japscan.se/lecture-en-ligne/notFound");
                        }
                        else {
                            result.push(aElement.href);
                        }
                    });
                    return result;
                }
            );
            await page.close();
            return volumeLinks.reverse();
        } catch (e) {
            throw `japdl n'a pas pu récupérer les chapitres du volume ${volumeNumber} du manga ${mangaName}, qui a une longueur de chapitre de ${chapters.length}, erreur ${e}`;
        }
    }

    verbosePrint(msg: string): void {
        if (this.verbose) console.log(msg);
    }

    /**
     * destroy browser, do not use downloader after this operation (will crash)
     */
    async destroy(): Promise<void> {
        this.verbosePrint("Destruction du downloader");
        if(this.browser)
            await this.browser.close();
    }
}

export default Downloader;
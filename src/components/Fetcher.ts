import { Browser } from "puppeteer";
import Component from "./Component";
import { ComponentFlags, MangaInfos } from "../utils/types";
import url from "../utils/url";

class Fetcher extends Component {
    constructor(browser: Browser, flags: ComponentFlags, outputDirectory = "manga"){
        super(browser, flags, outputDirectory);
    }
    /**
     *
     * @param mangaName manga name
     * @param _page page you already have opened to prevent waiting for page initialisation
     * @returns manga stats
     */
    async fetchStats(
        mangaName: string
    ): Promise<MangaInfos> {
        this.verbosePrint(console.log, "Récupération des infos du manga " + mangaName);
        const link = url.joinJapscanURL(this.WEBSITE, "manga", mangaName);
        const page = await this.createExistingPage(link);
        const pageMangaName = url.getAttributesFromLink(page.url()).manga;
        const chapterList = await page.$("#chapters_list");
        const volumes = await chapterList?.$$("h4");
        const lastChapterLink = await chapterList?.$eval(".collapse", (el) => {
            const div = el.querySelector("div");
            if (div !== null) {
                const a = div.querySelector("a");
                if (a !== null) {
                    return a.href;
                }
            }
        });

        if (lastChapterLink === undefined) {
            throw new Error(
                "japdl n'a pas pu récupérer les infos de " +
                mangaName +
                ", ce manga ne se trouve pas à ce nom sur japscan"
            );
        }
        if (volumes === undefined) {
            throw new Error(
                "japdl n'a pas pu trouver la liste des chapitres sur la page du manga " +
                mangaName
            );
        }
        const chapter = url.getAttributesFromLink(lastChapterLink).chapter;
        page.close();
        return {
            volumes: volumes?.length,
            chapters: +chapter,
            name: pageMangaName,
        };
    }
    /**
     *
     * @param volumeNumber volume number
     * @param  mangaName manga name
     * @returns array of link to the chapters in volume volumeNumber
     */
    async fetchVolumeChapters(
        volumeNumber: number,
        mangaName: string
    ): Promise<Array<string>> {
        this.verbosePrint(console.log,
            "Récupération des chapitres du volume " +
            volumeNumber +
            " du manga " +
            mangaName
        );
        const link = url.joinJapscanURL(this.WEBSITE, "manga", mangaName);

        const page = await this.createExistingPage(link);
        const chapterList = await page.$("#chapters_list");
        const numberOfVolumes = (await this.fetchStats(mangaName)).volumes;

        if (volumeNumber > numberOfVolumes || volumeNumber <= 0) {
            throw new Error(
                `Le numéro de volume (${volumeNumber}) ne peut pas être plus grand que le nombre actuel de volumes (${numberOfVolumes}) ou moins de 1`
            );
        }
        const chapters = await chapterList?.$$(".collapse");
        if (chapters === undefined) {
            throw new Error(
                "Le programme n'a pas pu accéder au contenu du volume " + volumeNumber
            );
        }
        try {
            const volumeLinks = await chapters[
                chapters.length - volumeNumber
            ].evaluate((el: Element) => {
                const result: Array<string> = [];
                el.querySelectorAll("div").forEach((el) => {
                    const aElement = el.querySelector("a");
                    if (aElement === null) {
                        result.push("https://japscan.se/lecture-en-ligne/notFound");
                    } else {
                        result.push(aElement.href);
                    }
                });
                return result;
            });
            await page.close();
            return volumeLinks.reverse();
        } catch (e) {
            throw new Error(
                `japdl n'a pas pu récupérer les chapitres du volume ${volumeNumber} du manga ${mangaName}, qui a une longueur de chapitre de ${chapters.length}, erreur ${e}`
            );
        }
    }

    /**
     *
     * @param mangaName manga name
     * @param start start chapter
     * @param end end chapter
     * @returns array of links to download from in range start - end
     */
    async fetchChapterLinksBetweenRange(
        mangaName: string,
        start: number,
        end: number
    ): Promise<string[]> {
        if (end < start) {
            throw new Error(
                "Le début ne peut pas être plus grand que la fin (début: " +
                start +
                ", fin: " +
                end +
                ")"
            );
        }
        const link = url.joinJapscanURL(this.WEBSITE, "manga", mangaName);
        const page = await this.createExistingPage(link);
        const linksToChapters = await page.evaluate(() => {
            const allElements = <NodeListOf<HTMLAnchorElement>>(
                document.querySelectorAll("#chapters_list > .collapse > div > a")
            );
            const links: string[] = [];
            allElements.forEach((el: HTMLAnchorElement) => {
                links.push(el.href);
            });
            return links;
        });
        const rangeLinks = linksToChapters.filter((_link) => {
            if (_link.includes("volume-")) return false;
            const chapterNumber = +_link.split(/\/+/)[4];
            if (chapterNumber >= start && chapterNumber <= end) {
                return true;
            }
            return false;
        });
        return rangeLinks.reverse();
    }

    /**
     *
     * @param link to fetch from
     * @returns number of pages in chapter
     */
    async fetchNumberOfPagesInChapter(link: string): Promise<number> {
        this.verbosePrint(console.log,
            "Recupération du nombre de pages pour le chapitre " + link
        );
        const startPage = await this.createExistingPage(link);
        const chapterSelectSelector =
            "div.div-select:nth-child(2) > .ss-main > .ss-content > .ss-list";
        try {
            this.verbosePrint(console.log, "Attente du script de page...");
            await startPage.waitForSelector(chapterSelectSelector, {
                timeout: this.timeout,
            });
            this.verbosePrint(console.log, "Attente terminée");
        } catch (e) {
            await startPage.close();
            return await this.fetchNumberOfPagesInChapter(link);
        }
        const chapterSelect = await startPage.$(chapterSelectSelector);

        if (chapterSelect === null) {
            throw new Error(
                "Japdl n'a pas pu déterminer le nombre de pages dans le chapitre (menu déroulant) du lien " +
                link
            );
        }
        const numberOfPages = await chapterSelect.evaluate(
            (el) => el.childElementCount
        );
        this.verbosePrint(console.log, "Nombre de page(s): " + numberOfPages);
        await startPage.close();
        return numberOfPages;
    }
}

export default Fetcher;
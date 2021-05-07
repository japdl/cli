import { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import yargs from "yargs";
import path from "path";
import zipper from "./utils/zipper";
import upath from "./utils/upath";
import url from "./utils/url";
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
  fast: boolean;
  timeout: number;
  onPage: (
    attributes: {
      manga: string;
      chapter: string;
      page: string;
    },
    savePath: string
  ) => void;

  /**
   * Instantiates a browser and reads config file to get output directory
   * and chrome path
   */
  constructor(options?: {
    onPage?: (
      attributes: {
        manga: string;
        chapter: string;
        page: string;
      },
      savePath: string
    ) => void;
  }) {
    if (options && options.onPage) {
      this.onPage = options.onPage;
    } else {
      this.onPage = (
        attributes: {
          manga: string;
          chapter: string;
          page: string;
        },
        savePath: string
      ) => {
        console.log(
          attributes.manga +
            " " +
            attributes.chapter +
            " page " +
            attributes.page +
            " a été téléchargé à l'endroit: " +
            path.resolve(savePath)
        );
      };
    }
    // flags
    const flags = yargs(process.argv.slice(2))
      .option("v", { alias: "verbose", boolean: true, default: false })
      .option("h", { alias: "headless", boolean: true, default: false })
      .option("f", { alias: "fast", boolean: true, default: false })
      .option("t", { alias: "timeout", number: true, default: 60 }).argv;

    if (flags.f) {
      console.log(
        "Attention! Le flag 'fast' est activé. Le programme ne garantit plus de récupérer toutes les images des chapitres. Une bonne connexion et un bon ordinateur est très fortement recommandé pour l'utilisation de ce flag. Dans le cas contraire, des images pourraient manquer."
      );
    }
    this.verbose = flags.v;
    const headless = !flags.h;
    this.fast = flags.f;
    this.timeout = flags.t * 1000;

    // config variables
    const configVariables = upath.config.getConfigVariables();
    this.outputDirectory = configVariables.outputDirectory;
    this.chromePath = upath.chrome.getChromePath(configVariables.chromePath);

    // launch puppeteer
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
          if (e.toString().includes("FetchError")) {
            reject(
              "Une erreur s'est produite, vérifiez que vous avez bien une connexion internet"
            );
          } else if (e.toString().includes("EACCES")) {
            reject(
              "L'executable chrome à l'endroit " +
                this.chromePath +
                " ne peut pas être lancé: japdl n'a pas les permissions. Cela est dû à un manque de permission. Sur linux, la solution peut être: 'chmod 777 " +
                this.chromePath +
                "'"
            );
          } else if (e.toString().includes("ENOENT")) {
            reject(
              "Le chemin de chrome donné (" +
                this.chromePath +
                ") n'est pas correct: " +
                e
            );
          } else if (e.toString().includes("Could not find expected browser")) {
            reject("Chromium n'a pas été trouvé à côté de l'executable");
          }
          reject("Une erreur s'est produite lors de l'initialisation: " + e);
        });
    });
  }
  /** if page exists, go to it, else throw error
   * @param link link to go to
   * @returns a valid japscan page
   */
  async goToExistingPage(link: string): Promise<Page> {
    const page = await this.browser.newPage();
    try {
      await page.goto(link, { timeout: this.timeout });
    } catch (e) {
      return await this.goToExistingPage(link);
    }
    if (await this.isJapscan404(page)) {
      throw new Error("La page " + link + " n'existe pas (404)");
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
      return (
        (await page.$eval(
          "div.container:nth-child(2) > h1:nth-child(1)",
          (element: Element) => element.innerHTML
        )) === "Oops!"
      );
    } catch (e) {
      return false;
    }
  }

  /**
   *
   * @param param can be a link or manga attributes
   * @returns path to manga without filename
   */
  getPathFrom(
    param:
      | string
      | {
          manga: string;
          chapter: string;
          page: string;
        }
  ): string {
    if (typeof param === "string") {
      return this.getPathFrom(url.getAttributesFromLink(param));
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
    this.verbosePrint(
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
    return this.downloadChapterFromLink(link, true);
  }

  /**
   * @param mangaName manga name
   * @param start start chapter
   * @param end end chapter
   * @returns download locations as an array
   */
  async downloadChapters(
    mangaName: string,
    start: number,
    end: number
  ): Promise<string[]> {
    this.verbosePrint(
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
    this.verbosePrint("Liens à télécharger: ", linksToDownload);
    for (const link of linksToDownload) {
      chapterDownloadLocations.push(await this.downloadChapterFromLink(link));
    }
    return chapterDownloadLocations;
  }

  /**
   * @param link link to download from
   * @param compression default as false, tells if chapter is compressed as a cbr after downloading
   * @returns
   */
  async downloadChapterFromLink(
    link: string,
    compression = false
  ): Promise<string> {
    this.verbosePrint("Téléchargement du chapitre depuis le lien " + link);
    const startAttributes = url.getAttributesFromLink(link);
    const numberOfPages = await this.fetchNumberOfPagesInChapter(link);

    const couldNotDownload: string[] = [];
    for (let i = 1; i <= numberOfPages; i++) {
      const pageLink = `${link}${i}.html`;
      const isDownloaded = await this.downloadImageFromLink(pageLink);
      if (!isDownloaded) {
        couldNotDownload.push(pageLink);
      }
    }

    console.log(
      "Le chapitre " + startAttributes.chapter + " a bien été téléchargé"
    );
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
      await zipper.zipDirectories(
        [this.getPathFrom(startAttributes)],
        this.getCbrFrom(
          startAttributes.manga,
          parseInt(startAttributes.chapter),
          "chapitre"
        )
      );
    }
    return this.getPathFrom(startAttributes);
  }

  /**
   * @param link link to download from
   * @returns if image could be downloaded
   */
  async downloadImageFromLink(link: string): Promise<boolean> {
    this.verbosePrint("Téléchargement de l'image depuis le lien " + link);
    const page = await this.goToExistingPage(link);

    this.verbosePrint("Injection du script");
    await page.addScriptTag({
      path: path.join(__dirname, "inject/inject.js"),
    });

    const popupCanvasSelector = "body > canvas";
    try {
      this.verbosePrint("Attente du script de page...");
      await page.waitForSelector(popupCanvasSelector, {
        timeout: this.timeout,
      });
      this.verbosePrint("Attente terminée");
    } catch (e) {
      console.log("Cette page n'a pas l'air d'avoir d'images");
      await page.close();
      return false;
    }

    const attributes = url.getAttributesFromLink(link);

    let savePath = path.posix.join(
      this.outputDirectory,
      attributes.manga,
      attributes.chapter
    );
    upath.fsplus.createPath(savePath);
    savePath = path.posix.join(savePath, url.getFilenameFrom(attributes));
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
    this.verbosePrint("Téléchargement de l'image...");
    await canvasElement
      ?.screenshot({
        omitBackground: true,
        path: savePath,
        type: "jpeg",
        quality: 100,
      })
      .catch((e) => console.log("Erreur dans la capture de l'image", e));
    this.onPage(attributes, savePath);
    page.close();
    return true;
  }

  async downloadVolumes(
    mangaName: string,
    start: number,
    end: number
  ): Promise<string[][]> {
    this.verbosePrint(
      "Téléchargement des volumes " + mangaName + " de " + start + " à " + end
    );
    if (start > end) {
      throw new Error("Le début ne peut pas être plus grand que la fin");
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
  async downloadVolume(
    mangaName: string,
    volumeNumber: number
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
    this.verbosePrint("Récupération des informations sur le volume...");

    const toDownloadFrom = await this.fetchVolumeChapters(
      volumeNumber,
      mangaName
    );

    this.verbosePrint("Récupéré");
    const waiters = [];
    const downloadLocations: Array<string> = [];
    for (const link of toDownloadFrom) {
      console.log("Téléchargement de " + link);
      // should return path of download
      const chapterPromise = this.downloadChapterFromLink(link);
      if (this.fast) {
        waiters.push(chapterPromise);
      } else {
        downloadLocations.push(await chapterPromise);
      }
    }

    if (this.fast) {
      for (const waiter of waiters) {
        downloadLocations.push(await waiter);
      }
    }
    const cbrName = this.getCbrFrom(mangaName, volumeNumber, "volume");
    console.log(
      "En train de faire le cbr " +
        mangaName +
        " volume " +
        volumeNumber +
        "..."
    );
    await zipper
      .zipDirectories(downloadLocations, cbrName)
      .catch((e) => console.log("Erreur pendant la création du cbr:", e));
    console.log("Cbr terminé! Il est enregistré à l'endroit " + cbrName);
    return downloadLocations;
  }
  /**
   *
   * @param mangaName manga name
   * @param _page page you already have opened to prevent waiting for page initialisation
   * @returns manga stats
   */
  async fetchStats(
    mangaName: string,
    _page?: Page
  ): Promise<{
    volumes: number;
    chapters: number;
    name: string;
  }> {
    this.verbosePrint("Récupération des infos du manga " + mangaName);
    const link = url.joinJapscanURL(this.WEBSITE, "manga", mangaName);
    const page = _page || (await this.goToExistingPage(link));
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
    if (!_page) {
      page.close();
    }
    const chapter = url.getAttributesFromLink(lastChapterLink).chapter;
    return {
      volumes: volumes?.length,
      chapters: parseInt(chapter),
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
    this.verbosePrint(
      "Récupération des chapitres du volume " +
        volumeNumber +
        " du manga " +
        mangaName
    );
    const link = url.joinJapscanURL(this.WEBSITE, "manga", mangaName);

    const page = await this.goToExistingPage(link);
    const chapterList = await page.$("#chapters_list");
    const numberOfVolumes = (await this.fetchStats(mangaName, page)).volumes;

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
    const page = await this.goToExistingPage(link);
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
      const chapterNumber = parseFloat(_link.split(/\/+/)[4]);
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
    this.verbosePrint(
      "Recupération du nombre de pages pour le chapitre " + link
    );
    const startPage = await this.goToExistingPage(link);
    const chapterSelectSelector =
      "div.div-select:nth-child(2) > .ss-main > .ss-content > .ss-list";
    try {
      this.verbosePrint("Attente du script de page...");
      await startPage.waitForSelector(chapterSelectSelector, {
        timeout: this.timeout,
      });
      this.verbosePrint("Attente terminée");
    } catch (e) {
      await startPage.close();
      return await this.fetchNumberOfPagesInChapter(link);
    }
    const chapterSelect = await startPage.$(chapterSelectSelector);

    if (chapterSelect === null) {
      throw new Error(
        "Pas pu récup select scroll, Japdl n'a pas pu déterminer le nombre de pages dans le chapitre du lien " +
          link
      );
    }
    const numberOfPages = await chapterSelect.evaluate(
      (el) => el.childElementCount
    );
    this.verbosePrint("Nombre de page(s): " + numberOfPages);
    await startPage.close();
    return numberOfPages;
  }

  verbosePrint(...msg: unknown[]): void {
    if (this.verbose) console.log(...msg);
  }

  /**
   * destroy browser, do not use downloader after this operation (will crash)
   */
  async destroy(): Promise<void> {
    this.verbosePrint("Destruction du downloader");
    if (this.browser) await this.browser.close();
  }

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

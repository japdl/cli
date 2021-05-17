import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import { Browser } from "puppeteer";

puppeteer
    .use(StealthPlugin())
    .use(AdblockerPlugin({ blockTrackers: true }));

const getBrowser = async (visible: boolean, chromePath: string): Promise<Browser> => {
    try {
        const browser = await puppeteer
            .launch({
                headless: !visible,
                executablePath: chromePath,
            });
        await browser.newPage();
        return browser;
    } catch (e) {
        if (e.toString().includes("FetchError")) {
            throw new Error(
                "Une erreur s'est produite, vérifiez que vous avez bien une connexion internet" +
                ", erreur complète:\n" + e
            );
        } else if (e.toString().includes("EACCES")) {
            throw new Error(
                "L'executable chrome à l'endroit " +
                chromePath +
                " ne peut pas être lancé: japdl n'a pas les permissions. Cela est dû à un manque de permission. Sur linux, la solution peut être: 'chmod 777 " +
                chromePath +
                "', erreur complète:\n" + e
            );
        } else if (e.toString().includes("ENOENT")) {
            throw new Error(
                "Le chemin de chrome donné (" +
                chromePath +
                ") n'est pas correct: " +
                e
            );
        } else if (e.toString().includes("Could not find expected browser")) {
            throw new Error("Chromium n'a pas été trouvé à côté de l'executable");
        }
        throw new Error("Une erreur s'est produite lors de l'initialisation: " + e);
    }
}

export default getBrowser;
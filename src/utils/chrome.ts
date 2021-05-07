import fs from "fs";
import path from "path";

const chrome = {
    getChromePath(path?: string): string {
        if (fs.existsSync(".local-chromium")) {
            return this.getChromeInfos().path;
        }
        if (path) {
            if (fs.existsSync(path)) {
                return path;
            } else {
                console.log(
                    `Le chemin ${path} donné dans le fichier config n'est pas un chemin valide`
                );
            }
        }
        let possiblePaths: string[] = [];
        // If program runs on windows
        if (process.platform === "win32") {
            possiblePaths = [
                "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
                "C:\\Program Files (x86)\\Google\\Chrome SxS\\Application\\chrome.exe",
                "C:\\Program Files (x86)\\Chromium\\Application\\chrome.exe",
                "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
                "C:\\Program Files\\Google\\Chrome SxS\\Application\\chrome.exe",
                "C:\\Program Files\\Chromium\\Application\\chrome.exe",
                "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
                "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
            ];
        }
        for (const path of possiblePaths) {
            if (fs.existsSync(path)) {
                return path;
            }
        }
        throw "Chrome n'a pas été trouvé sur l'ordinateur. Veuillez utiliser le fichier config.txt pour y spécifier le chemin.";
    },
    getChromeInfos(): {
        revision: string;
        path: string;
    } {
        const revision = "869685";
        let chromePath;
        if (process.platform === "win32") {
            chromePath = path.join(
                ".local-chromium",
                `win64-${revision}`,
                "chrome-win",
                "chrome.exe"
            );
        } else {
            chromePath = path.join(
                ".local-chromium",
                `linux-${revision}`,
                "chrome-linux",
                "chrome"
            );
        }
        return {
            revision: revision,
            path: path.resolve(chromePath),
        };
    },
};

export default chrome;
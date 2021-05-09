import fs from "fs";
import chrome from "./chrome";

const config = {
    getConfigVariables(): {
        chromePath: string;
        outputDirectory: string;
    } {
        let fileContent;
        try {
            fileContent = fs
                .readFileSync("./config.txt", { encoding: "utf-8" })
                .split(/\n+/);
        } catch (e) {
            console.log(
                "Fichier config.txt non trouvé, les paramètres de base vont être appliqués."
            );
            return { chromePath: chrome.getChromePath(), outputDirectory: "manga" };
        }
        let chromePath = "";
        let outputDirectory = "manga";
        fileContent.forEach((line) => {
            if (line.startsWith("#")) {
                return;
            }
            if (line.startsWith("chrome_path=")) {
                chromePath = line.substr("chrome_path=".length).trim();
            } else if (line.startsWith("output_dir=")) {
                outputDirectory = line.substr("output_dir=".length).trim();
            }
        });
        return {
            chromePath: chromePath,
            outputDirectory: outputDirectory,
        };
    },
};

export default config;
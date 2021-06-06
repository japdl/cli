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
            return { chromePath: chrome.getChromePath(), outputDirectory: "manga" };
        }
        let chromePath = "";
        let outputDirectory = "manga";
        fileContent.forEach((line) => {
            function trimSpacesAroundEqualSign() {
                return line
                    // remove useless spaces
                    .trim()
                    // split on first equal sign
                    .split(/=(.+)/)
                    // remove empty spaces from each part of split
                    .map(el => el.trim())
                    // remove '' element(s)
                    .filter((el) => el)
                    // rejoin with =
                    .join('=');
            }
            if (line.startsWith("#")) return;
            if (line.startsWith("chrome_path")) {
                chromePath = trimSpacesAroundEqualSign().substr("chrome_path=".length);
            } else if (line.startsWith("output_dir")) {
                outputDirectory = trimSpacesAroundEqualSign().substr("output_dir=".length);
            }
        });
        return {
            chromePath: chromePath,
            outputDirectory: outputDirectory,
        };
    },
};

export default config;
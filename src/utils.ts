import archiver from "archiver";
import fs from "fs";
import Interface from "./interface";

/**
 * Zipper contains functions that helps zipping
 */
const zipper = {
    /**
     * @param {String[]} source is an array of path
     * @param {String} out is the filename
     */
    zipDirectories(source: string[], out: string): Promise<void> {
        const archive = archiver('zip', { zlib: { level: 9 } });
        const stream = fs.createWriteStream(out);

        return new Promise((resolve, reject) => {
            source.forEach((s) => {
                archive.directory(s, false);
            })
            archive
                .on('error', err => reject(err))
                .pipe(stream);


            stream.on('close', () => resolve());
            archive.finalize();
        });
    }
}

/**
 * Contains path functions to help manage paths and files
 */
const path = {
    async getCommands(): Promise<Record<string, {
        description: string;
        usage: string;
        aliases: string[];
        example: string[];
        argsNeeded: number;
        execute(inter: Interface, args: string[]): Promise<void>;
    }>> {
        const files = this.getCommandsKeys();
        const commands: Record<string, {
            description: string;
            usage: string;
            aliases: string[];
            example: string[];
            argsNeeded: number;
            execute(inter: Interface, args: string[]): Promise<void>;
        }> = {};
        for (const file of files) {
            const imported = await import("../commands/" + file).catch((e) => console.log(e));
            commands[file] = imported;

            // for each alias, copy function to alias key
            imported.aliases.forEach((alias: string) => {
                commands[alias] = imported;
            });
        }
        return commands;
    },
    getCommandsKeys(): string[] {
        return fs.readdirSync(__dirname + "/../commands").filter((filename) => filename.endsWith('.js')).map((filename) => filename.split('.')[0]);
    },
    tellIfDoesntExist(locations: string[]): boolean {
        const found = [];
        locations.forEach((location) => {
            if (!fs.existsSync(location)) {
                console.log("Attention: le chapitre " + location + " n'a pas été trouvé sur votre disque.");
            } else {
                found.push({ location: location });
            }
        });
        console.log(`${found.length}/${locations.length} ont été ajoutés au zip`);
        return !!found.length;
    },
    mkdirIfDoesntExist(path: string): void {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    },
    rmdirRecur(path: string): void {
        const files = fs.readdirSync(path);
        files.forEach((file) => {
            const pathToFile = path + file;
            if (fs.lstatSync(pathToFile).isDirectory()) {
                this.rmdirRecur(pathToFile);
                fs.rmdirSync(path);
            }
            else {
                fs.unlinkSync(pathToFile);
            }
        });
        fs.rmdirSync(path);
    },
    getConfigVariables(): ConfigVariables {
        let fileContent;
        try {
            fileContent = fs.readFileSync("./config.txt", { encoding: "utf-8" }).split(/\n+/);
        } catch (e) {
            console.log("Fichier config.txt non trouvé, les paramètres de base vont être appliqués.");
            return { chromePath: this.getChromePath(), outputDirectory: "manga" };
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
            outputDirectory: outputDirectory
        };
    },
    alreadyDownloaded(path: string): boolean {
        let folderExists = false;
        try {
            folderExists = fs.lstatSync(path).isDirectory();
            return folderExists;
        } catch (e) {
            return false;
        }
        // TODO: try to see cbr?
    },
    rmIfSFlag(args: string[], downloadLocations: string[]): void {
        if (args[3].toLowerCase().includes('s')) {
            downloadLocations.forEach((path: string) => this.rmdirRecur(path));
        }
    },
    getChromePath(path?: string): string {
        if (path) {
            if (fs.existsSync(path)) {
                return path;
            } else {
                console.log(`Le chemin ${path} donné dans le fichier config n'est pas un chemin valide`);

            }
        }
        let possiblePaths: string[] = [];
        // If program runs on windows
        if (process.platform === "win32") {
            possiblePaths = [
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome SxS\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Chromium\\Application\\chrome.exe',
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files\\Google\\Chrome SxS\\Application\\chrome.exe',
                'C:\\Program Files\\Chromium\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
                'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
            ];
        }
        for (const path of possiblePaths) {
            if (fs.existsSync(path)) {
                return path;
            }
        }
        throw "Chrome n'a pas été trouvé sur l'ordinateur. Veuillez utiliser le fichier config.txt pour y spécifier le chemin.";
    },
    createPath(_path: string): void {
        const split = _path.split("/");
        let path = "";
        split.forEach((folder: string) => {
            if (folder === "") return;
            path += folder + "/";
            this.mkdirIfDoesntExist(path);
        });
    },
}

/**
 * Inject script
 */
const inject = `
Element.prototype._attachShadow = Element.prototype.attachShadow;
Element.prototype.attachShadow = function () {
  const toReturn = this._attachShadow({ mode: "open" });
  document.save = this.shadowRoot;
  document.toReturn = toReturn;
  setTimeout(() => {
    const allCanvas = document.toReturn
      .querySelector("div")
      .querySelectorAll("canvas");
    allCanvas.forEach((canvas) => {
      try {
        canvas.getContext("2d").getImageData(0, 0, 0, 0);
      } catch (e) {
        document.body.appendChild(canvas);
      }
    });
  });
  return toReturn;
};
`;

export default {
    zipper: zipper,
    path: path,
    inject: inject
}

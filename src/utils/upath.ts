import CLIInterface from "../CLIInterface";
import fs from "fs";
import path from "path";

const commands = {
  async getCommands(): Promise<
    Record<
      string,
      {
        description: string;
        usage: string;
        aliases: string[];
        example: string[];
        argsNeeded: number;
        execute(inter: CLIInterface, args: string[]): Promise<void>;
      }
    >
  > {
    const files = this.getCommandsKeys();
    const commands: Record<
      string,
      {
        description: string;
        usage: string;
        aliases: string[];
        example: string[];
        argsNeeded: number;
        execute(inter: CLIInterface, args: string[]): Promise<void>;
      }
    > = {};
    for (const file of files) {
      const imported = await import("../../commands/" + file).catch((e) =>
        console.log(e)
      );
      commands[file] = imported;

      // for each alias, copy function to alias key
      imported.aliases.forEach((alias: string) => {
        commands[alias] = imported;
      });
    }
    return commands;
  },
  getCommandsKeys(): string[] {
    return fs
      .readdirSync(__dirname + "/../../commands")
      .filter((filename) => filename.endsWith(".js"))
      .map((filename) => filename.split(".")[0]);
  },
};

const fsplus = {
  tellIfDoesntExist(locations: string[]): boolean {
    const found = [];
    locations.forEach((location) => {
      if (!fs.existsSync(location)) {
        console.log(
          "Attention: le chapitre " +
            location +
            " n'a pas été trouvé sur votre disque."
        );
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
  createPath(_path: string): void {
    const split = _path.split("/");
    let path = "";
    split.forEach((folder: string) => {
      if (folder === "") return;
      path += folder + "/";
      this.mkdirIfDoesntExist(path);
    });
  },
};

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

const manga = {
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
    if (args[3].toLowerCase().includes("s")) {
      downloadLocations.forEach((path: string) =>
        fs.rmSync(path, { force: true, recursive: true })
      );
    }
  },
};

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

/**
 * Contains path functions to help manage paths and files
 */
export default {
    commands:commands,
    fsplus: fsplus,
    chrome: chrome,
    manga: manga,
    config: config
}
import readline from "readline";
import Downloader from "./downloader";
import utils from "./utils";
/**
 * Interface implementation for downloader
 */
class Interface extends Downloader {
    rl: readline.Interface;
    downloader!: Downloader;
    commands: Record<string, (args: string[]) => Promise<void>>;

    constructor(flags: Record<string, boolean>) {
        super(flags);
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false,
        });

        this.commands = {
            help: async (): Promise<void> => {
                this.displayHelp();
            },
            telecharge: async (args: string[]): Promise<void> => {
                if (args.length < 3) {
                    console.log("Il manque des arguments");
                    return;
                }
                const mangaName = args[0];
                const type = args[1];
                if (type !== "volume" && type !== "chapitre") {
                    console.log("japdl ne peut pas télécharger de '" + type + "', il ne peut télécharger que:");
                    console.log("- 'volume'");
                    console.log("- 'chapitre'");
                    return;
                }
                let range!: MangaRange;
                let number!: number;
                if (args[2].indexOf('-') !== -1) {
                    const split = args[2].split('-');
                    range = { start: parseInt(split[0]), end: parseInt(split[1]) };
                } else {
                    number = parseInt(args[2]);
                    if (isNaN(number)) {
                        console.log("le numéro de" + type + "n'a pas pu être lu");
                        return;
                    }
                }
                if (args[3] === undefined) {
                    args[3] = '';
                }
                switch (type) {
                    case "volume": {
                        if (range) {
                            const downloadLocationsArray = await this.downloadVolumes(mangaName, range.start, range.end);
                            downloadLocationsArray.forEach((downloadLocations) => {
                                utils.path.rmIfSFlag(args, downloadLocations);
                            });
                        } else {
                            const downloadLocations = await this.downloadVolume(mangaName, number);
                            utils.path.rmIfSFlag(args, downloadLocations);
                        }
                        break;
                    }
                    case "chapitre":
                        if (range) {
                            const downloadLocations = await this.downloadChapters(mangaName, range.start, range.end);
                            utils.path.rmIfSFlag(args, downloadLocations);
                        } else {
                            if (args[3].toLowerCase().indexOf('f') === -1 && utils.path.alreadyDownloaded(this.outputDirectory + "/" + mangaName + "/" + number)) {
                                console.log("Le chapitre est déjà téléchargé, si vous voulez quand même le re-télécharger,");
                                console.log("Il faut spécifier l'argument 'f' après le numéro de chapitre.");
                                return;
                            }
                            const downloadLocation = await this.downloadChapter(mangaName, number);
                            utils.path.rmIfSFlag(args, [downloadLocation]);
                        }
                        break;
                    default:
                        console.log("Le type de téléchargement n'a pas été reconnu, il doit être soit 'volume', soit 'chapitre'");
                        break;
                }
            },
            zip: async (args: string[]): Promise<void> => {
                if(args.length < 3){
                    throw "Il manque des arguments à cette commande";
                }
                const mangaName = args[0];
                const type = args[1];
                if (type !== "volume" && type !== "chapitre") {
                    throw `japdl ne peut pas zipper de ${type}, il ne peut zipper que:
                    - 'volume'
                    - 'chapitre'`
                }
                const number = parseInt(args[2]);
                let toZip: string[] = [];
                if (type === 'chapitre') {
                    const path = this.getPathFrom({ chapter: number.toString(), manga: mangaName, page: "" + 1 });
                    console.log(path);
                    toZip = [path];
                }
                if (type === 'volume') {
                    const chapters: string[] = await this.fetchVolumeChapters(number, mangaName);
                    chapters.forEach((chapter) => {
                        toZip.push(this.getPathFrom(chapter));
                    });
                }
                const isWorthZipping = utils.path.tellIfDoesntExist(toZip);
                if (isWorthZipping) {
                    utils.zipper.zipDirectories(toZip, this.getCbrFrom(mangaName, number, type));
                }
            },
            info: async (args: string[]): Promise<void> => {
                function prettyPrint(value: number, type: string) {
                    console.log(`${mangaName} possède ${value} ${type}${(value > 1) ? "s" : ""}`);
                }
                const mangaName = args[0];
                const mangaStats: MangaStats = await this.fetchStats(mangaName);
                if (!isNaN(mangaStats.volumes)) {
                    prettyPrint(mangaStats.volumes, "volume");
                }
                if (!isNaN(mangaStats.chapters)) {
                    prettyPrint(mangaStats.chapters, "chapitre");
                }
                if (mangaName !== mangaStats.name) {
                    console.log(`Le manga '${mangaName}' s'appelle '${mangaStats.name}' sur japscan`);
                }
            },
            quit: async (): Promise<void> => {
                this.quit();
            },
            q: async (): Promise<void> => {
                this.quit();
            },
        };
    }
    /**
     * Quit program after destroying downloader
     */
    async quit(): Promise<void> {
        console.log("Merci d'avoir utilisé japdl!");
        await this.destroy();
        process.exit(0);
    }
    /**
     * Starts reading commands from terminal
     */
    handleInput(): void {
        this.rl.on('line', (line) => this.readCommands(line));
    }
    /**
     * Stops reading commands from terminal
     */
    closeInput(): void {
        this.rl.removeAllListeners();
    }
    /**
     * Displays help in terminal
     */
    displayHelp(): void {
        console.log("- help -> réécrit cette aide");
        console.log("- q ou quit -> quitte le programme");
        console.log("- telecharge -> exemples: ");
        console.log("\ttelecharge one-piece volume 99");
        console.log("\ttelecharge chainsaw-man chapitre 50");
        console.log("\ttelecharge fire-punch volume 1-8");
        console.log("\ttelecharge demon-slayer chapitre 1-50");
        console.log("\tOn peut rajouter des lettres après le(s) numéro(s) de chapitre/volume:");
        console.log("\t\tf : force le téléchargement même si le dossier du chapitre existe déjà ");
        console.log("\t\ts: supprime les dossiers d'image après la création du cbr");
        console.log("\t\tExemple des 2 lettres: telecharge one-piece chapitre 999 sf");
        console.log("\t\tL'ordre des lettres n'a pas d'importance");
        console.log("- zip -> zip one-piece chapitre 999");
        console.log("\tZip le dossier d'image du chapitre 999 en cbr");
        console.log("- info -> info one-piece");
        console.log("\tDonne le nombre de chapitre et volume du manga");
    }
    /**
     * returns a resolved promise when a line is entered in the terminal with the line as the return string
     * @returns line it got
     */
    getLine(): Promise<string>{
        return new Promise((resolve) => {
            this.closeInput();
            this.rl.on('line', (line) => resolve(line));
            this.closeInput();
        });
    }
    /**
     * Handles commands from argument line taken in the terminal
     * Automatically used by handleInput()
     * @param line line to read commands from
     */
    async readCommands(line: string): Promise<void> {
        const split: string[] = line.split(/ +/);
        const command: string = split[0].toLowerCase();
        const args: string[] = split.slice(1);
        const fn = this.commands[command];
        if (fn === undefined) {
            console.log("La commande n'existe pas, tapez 'help' pour voir l'aide");
        } else {
            try {
                await fn(args);
            } catch (e) {
                console.log("Une erreur s'est produite:", e);
            }
        }
        this.printSeparator();
    }
    /**
     * Prints a line of separator characters in the terminal
     */
    printSeparator(): void{
        console.log("---------------------");
    }
    /**
     * Starts interface
     */
    start(): void {
        this.displayHelp();
        this.printSeparator();
        this.handleInput();
    }
}

export default Interface;
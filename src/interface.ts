import readline from "readline";
import Downloader from "./downloader";
import utils from "./utils";
/**
 * Interface implementation for downloader
 */
class Interface extends Downloader {
    rl: readline.Interface;
    downloader!: Downloader;
    commands: Promise<Record<string, {
        description: string;
        usage: string;
        aliases: string[];
        example: string[];
        argsNeeded: number;
        execute(inter: Interface, args: string[]): Promise<void>;
    }>>;
    commandsKeys: string[];

    constructor() {
        super();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false,
        });
        this.commands = utils.path.getCommands();
        this.commandsKeys = utils.path.getCommandsKeys();
    }
    /**
     * Quit program after destroying downloader
     */
    async quit(): Promise<void> {
        console.log("Merci d'avoir utilisé japdl!");
        this.closeInput();
        this.rl.close();
        await this.destroy();
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
    async dynamicDisplayHelp(): Promise<void> {
        const commands = await this.commands;
        this.commandsKeys.forEach((key: string) => {
            const command = commands[key];
            console.log("- " + key + ": " + command.description);
            console.log("\tusage: " + command.usage);
            if (command.argsNeeded) {
                console.log("\texemple" + ((command.example.length > 1) ? "s" : "") + ": \n\t\t- " + command.example.join('\n\t\t- '));
            }
            console.log();
        });
    }
    /**
     * returns a resolved promise when a line is entered in the terminal with the line as the return string
     * @returns line it got
     */
    getLine(): Promise<string> {
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
        const commandsReady = await this.commands;

        const commandObject = commandsReady[command];

        if (commandObject === undefined) {
            console.log("La commande n'existe pas, tapez 'help' pour voir l'aide");
        } else {
            if (commandObject.argsNeeded > args.length) {
                console.log("Il n'y a pas assez d'arguments pour cette commande.");
                console.log("usage: " + commandObject.usage);
                console.log("Des exemples sont présents dans l'aide");
            }
            try {
                await commandObject.execute(this, args);
            } catch (e) {
                console.log("Une erreur s'est produite:", e);
            }
        }
        this.printSeparator();
    }
    /**
     * Prints a line of separator characters in the terminal
     */
    printSeparator(): void {
        console.log("---------------------");
    }

    displayCommands(): void {
        this.commands.then((commands) => {
            this.commandsKeys.forEach((key: string) => {
                const command = commands[key];
                console.log("\t- " + ([key].concat(command.aliases)).join(' | '));
            });
        });
    }
    /**
     * Starts interface
     */
    start(): void {
        this.dynamicDisplayHelp().then(() => {
            this.printSeparator();
            this.handleInput();
        });   
    }
}

export default Interface;
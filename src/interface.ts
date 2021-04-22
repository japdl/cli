import readline from "readline";
import Downloader from "./downloader";
import utils from "./utils";
/**
 * Interface implementation for downloader
 */
class Interface extends Downloader {
    rl: readline.Interface;
    downloader!: Downloader;
    commands: Promise<Record<string,  {
        description: string;
        usage: string;
        aliases: string[];
        execute(inter: Interface, args: string[]): Promise<void>;
    }>>;

    constructor(flags: {
        [x: string]: unknown;
        v: boolean;
        h: boolean;
        f: boolean;
        _: (string | number)[];
        $0: string;
    }) {
        super(flags);
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false,
        });
        this.commands = utils.path.getCommands();
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
        const commandsReady = await this.commands;
        
        const commandObject = commandsReady[command];

        if (commandObject === undefined) {
            console.log("La commande n'existe pas, tapez 'help' pour voir l'aide");
        } else {
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
    printSeparator(): void{
        console.log("---------------------");
    }
    /**
     * Starts interface
     */
    start(): void {
        console.log("Commandes:");
        console.log("\t- help | aide | h");
        console.log("\t- telecharge | t");
        console.log("\t- zip | cbr | z");
        console.log("\t- info | i");
        console.log("\t- quit | q");
        
        this.printSeparator();
        this.handleInput();
    }
}

export default Interface;
import { Browser } from "puppeteer";
import readline from "readline";
import { Downloader } from "japscandl";
import commands from "./utils/commands";
import { CLICommand, ComponentFlags, MangaAttributes } from "./utils/types";
/**
 * Interface implementation for downloader
 */
class CLInterface extends Downloader {
    rl: readline.Interface;
    downloader!: Downloader;
    commands: Promise<Record<string, CLICommand>>;
    commandsKeys: string[];
    isQuitting: boolean;

    /**
     * Initiates basic options to downloader,
     * creates readline interface,
     * get commands from files in commands/
     */
    constructor(browser: Browser, options?: {
        flags?: ComponentFlags;
        outputDirectory?: string;
    }) {
        const basicOptions = {
            onPage: (
                attributes: MangaAttributes,
                totalPages: number
            ) => {
                const { manga, chapter } = attributes;
                const page = +attributes.page;
                const percent = ((page / totalPages) * 100).toFixed(2);
                let message = `${manga} ${chapter} page ${page}/${totalPages} (${percent}%)`;
                const barWidth = process.stdout.columns - message.length - 4; // bar width
                const currentlyDownloadedScaled = Math.floor((page / totalPages) * barWidth);
                message = `${message}  [${"=".repeat(currentlyDownloadedScaled)}${" ".repeat(barWidth - currentlyDownloadedScaled)}]`
                readline.cursorTo(process.stdout, 0);
                process.stdout.write(message);
                // if at the end, new line
                if (page === totalPages || this.verbose) process.stdout.write("\n");
            },
            onChapter: (attributes: MangaAttributes, currentChapter: number, totalChapters: number) => {
                const { manga, chapter } = attributes;
                const percent = ((currentChapter / totalChapters) * 100).toFixed(2);
                console.log(`${manga} ${chapter} a bien été téléchargé, ${currentChapter}/${totalChapters} (${percent}%)`);
            },
            onVolume: (mangaName: string, current: number, total: number) => {
                const percent = ((current / total) * 100).toFixed(2);
                console.log(`${mangaName} volume ${current}/${total} (${percent}%)`);
            }
        }
        super(browser, {
            ...options,
            onEvent: basicOptions,
        });
        browser.on('disconnected', () => {
            if (!this.isQuitting) {
                console.log("Le navigateur a été fermé, arrêt du programme.");
                this.quit();
            }
        });
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false,
        });
        this.commands = commands.getCommands();
        this.commandsKeys = commands.getCommandsKeys();
        this.isQuitting = false;
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
    async dynamicDisplayHelp(): Promise<void> {
        const commands = await this.commands;
        this.commandsKeys.forEach((key: string) => {
            const command = commands[key];
            console.log("- " + key + ": " + command.description);
            console.log("\tusage: " + command.usage);
            console.log("\talias: " + command.aliases.join(' '));
            if (command.argsNeeded) {
                console.log("\texemple" + ((command.example.length > 1) ? "s" : "") + ": \n\t\t- " + command.example.join('\n\t\t- '));
            }
        });
        console.log("\n /!\\ | Les noms de mangas ne peuvent pas contenir d'espaces ni de caractères spéciaux.");
        console.log("       Pour écrire One Piece par exemple, il faudra l'écrire de la manière suivante: 'one-piece'. Ce nom est décidé par japscan, pas par japdl.");
        console.log(`       Si vous n'êtes pas sûr, allez sur ${this.WEBSITE} à la page du manga. Le nom du manga sera dans le lien, après '${this.WEBSITE}/manga/'`);
    }
    /**
     * Handles commands from argument line taken in the terminal
     * Automatically used by handleInput()
     * @param line line to read commands from
     */
    async readCommands(line: string): Promise<void> {
        const split: string[] = line.split(/ +/);
        this._verbosePrint(console.table, split);
        const command: string = split[0].toLowerCase();
        const args: string[] = split.slice(1);
        args.map((arg) => arg.toLowerCase());
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
                console.log("Une erreur s'est produite:", e.message.toString());
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

    /**
     * Quit program after destroying downloader and readline interface
     */
    async quit(): Promise<void> {
        console.log("Merci d'avoir utilisé japdl!");
        this.isQuitting = true;
        this.closeInput();
        this.rl.close();
        await this.destroy();
    }
}

export default CLInterface;
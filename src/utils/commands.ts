import { CLICommand } from "./types";
import fs from "fs";

const commands = {
    async getCommands(): Promise<
        Record<
            string,
            CLICommand
        >
    > {
        const files = this.getCommandsKeys();
        const commands: Record<
            string,
            CLICommand
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

export default commands;
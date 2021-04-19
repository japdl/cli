import Downloader from "./downloader";
import Interface from "./interface";

function getDownloaderWithFlags() {
    const flagStrings: string[] = ['h', 'v'];
    const regex = new RegExp(`-${flagStrings.join('*')}*[^${flagStrings.join('')}]`, 'g');
    const flags: Record<string, boolean> = {};
    
    process.argv.filter((arg) => arg.startsWith('-')).forEach((arg) => {
        const match = [...arg.matchAll(regex)];
        if(match.length){
            console.log("Mauvais argument: " + arg + ", l'argument n'est pas reconnu.");
            process.exit(1);
        } else {
            flagStrings.forEach((flag) => {
                if(arg.includes(flag)){
                    if(!flags[flag]){
                        flags[flag] = true;
                    } else {
                        throw `Le flag '${flag}' ne peut pas utilisé plusieurs fois`;
                    }
                }
            })
        }
    });
    return new Downloader(flags);
}

const downloader = getDownloaderWithFlags();
downloader.onready.then(() => {
    const inter = new Interface(downloader);
    inter.start();
});
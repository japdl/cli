import Downloader from "./downloader";
import Interface from "./interface";

function getDownloaderFromFlags(){
    for(const arg of process.argv){
        if(arg.startsWith('-')){
            if(arg === '-h'){
                return new Downloader(false);
            }
        }
    }
    return new Downloader();
}

const downloader = getDownloaderFromFlags();
downloader.onready.then(() => {
    const inter = new Interface(downloader);
    inter.start();
});
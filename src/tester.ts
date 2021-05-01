import Downloader from "./Downloader";

const downloader = new Downloader();
downloader.onready.then(() => {
    console.log("Downloader ready");
    downloader.destroy();
})
import Downloader from "./downloader";

const downloader = new Downloader();
downloader.onready.then(() => {
    console.log("Downloader ready");
    downloader.destroy();
})
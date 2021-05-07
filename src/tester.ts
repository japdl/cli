import Downloader from "./Downloader";

const downloader = new Downloader();
downloader.onready.then(() => {
    console.log("Downloader ready");
    downloader.downloadWebtoon("https://www.japscan.se/lecture-en-ligne/solo-leveling/150/");
})
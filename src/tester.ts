import { Downloader } from "japscandl";
import japscandl from "japscandl";

japscandl.getBrowser(true, japscandl.utils.chrome.getChromePath()).then(async (browser) => {
    const downloader = new Downloader(browser);
    downloader.fetchStats("one-piece").then((stats) => console.log(stats));
})
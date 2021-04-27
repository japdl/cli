import puppeteer from "puppeteer-extra";
import path from "path";
import utils from "./utils";

(async () => {
    const revision = utils.path.getChromeInfos().revision;
    for(const platform of ['linux', 'win64', 'mac']){
        const fetcher = await puppeteer.createBrowserFetcher({platform: platform, path: path.resolve(".local-chromium/")})
        if(fetcher.canDownload(revision)){
            console.log(fetcher._getFolderPath(revision));
            console.log("Can download")
            // await fetcher.download(revision).catch((error) => console.log(error));
            console.log("done");
        } else {
            console.log("Can't download for " + platform);
        }
    }
})();

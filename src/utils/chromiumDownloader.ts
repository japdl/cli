import puppeteer from "puppeteer-extra";
import path from "path";
import upath from "./upath";

(async () => {
    const revision = upath.chrome.getChromeInfos().revision;
    const platforms = [
        'linux'
        , 'win64'
    ];
    for (const platform of platforms) {
        const fetcher = puppeteer.createBrowserFetcher({ platform: platform, path: path.resolve(".local-chromium/") })
        if (fetcher.canDownload(revision)) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            console.log(fetcher._getFolderPath(revision));
            console.log("Can download")
            await fetcher.download(revision).catch((error) => console.log(error));
            console.log("done");
        } else {
            console.log("Can't download for " + platform);
        }
    }
})();

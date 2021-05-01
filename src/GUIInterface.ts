import Downloader from "./Downloader";
import * as path from "path";
import { app, BrowserWindow } from "electron";

class GUIInterface extends Downloader {
  constructor() {
    super();
    app.on("ready", () => {
      console.log("App is ready");

      const win = new BrowserWindow({
        width: 600,
        height: 400,
      });

      const indexHTML = path.join(process.cwd(), "common", "index.html");
      win
        .loadFile(indexHTML)
        .then(() => {
          // IMPLEMENT FANCY STUFF HERE
        })
        .catch((e: Error) => console.error(e));
    });
  }
}

export default GUIInterface;
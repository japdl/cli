import archiver from "archiver";
import fs from "fs";
import Downloader from "../Downloader";

const zipper = {
    async safeZip(downloader: Downloader, mangaName: string, mangaType: string, mangaNumber: string, directories: string[]): Promise<void> {
        console.log(`En train de faire le cbr ${mangaName} ${mangaType} ${mangaNumber}...`);
        const cbrName = downloader.getCbrFrom(
            mangaName,
            mangaNumber,
            mangaType
        );
        await zipper.zipDirectories(
            directories,
            cbrName
        ).then(() => console.log("Cbr terminé! Il est enregistré à l'endroit " + cbrName))
            .catch((e) => console.log("Erreur pendant la création du cbr (" + cbrName + "):", e));
    },
    /**
     * @param {String[]} source is an array of path
     * @param {String} out is the filename
     */
    async zipDirectories(source: string[], out: string): Promise<void> {
        const archive = archiver("zip", { zlib: { level: 9 } });
        const stream = fs.createWriteStream(out);

        return new Promise((resolve, reject) => {
            source.forEach((s) => {
                archive.directory(s, false);
            });
            archive.on("error", (err) => reject(err)).pipe(stream);

            stream.on("close", () => resolve());
            archive.finalize();
        });
    },
};

export default zipper;

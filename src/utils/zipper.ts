import archiver from "archiver";
import fs from "fs";
import Downloader from "../Downloader";

const zipper = {
    async safeZip(downloader: Downloader, mangaName: string, mangaType: string, mangaNumber: string, directories: string[]): Promise<void> {
        function bytesToSize(bytes: number) {
            const sizes = ['octet', 'Ko', 'Mo', 'Go', 'To'];
            if (bytes == 0) return '0 ' + sizes[0];
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
         }
        console.log(`En train de faire le cbr ${mangaName} ${mangaType} ${mangaNumber}...`);
        const cbrName = downloader.getCbrFrom(
            mangaName,
            mangaNumber,
            mangaType
        );
        const infos = await zipper.zipDirectories(
            directories,
            cbrName
        )
        .catch((e) => console.log("Erreur pendant la création du cbr (" + cbrName + "):", e));
        if(!infos) throw new Error("Quelque chose s'est mal passé pendant la création du cbr");
        console.log("Cbr terminé! Il est enregistré à l'endroit " + infos.filename + " (" + bytesToSize(infos.archive.pointer()) + ")");
    },
    /**
     * @param {String[]} source is an array of path
     * @param {String} out is the filename
     */
    async zipDirectories(source: string[], out: string): Promise<{archive: archiver.Archiver, filename: string}> {
        const archive = archiver("zip", { zlib: { level: 9 } });
        const stream = fs.createWriteStream(out);

        return new Promise((resolve, reject) => {
            source.forEach((s) => {
                archive.directory(s, false);
            });
            archive.on("error", (err) => reject(err)).pipe(stream);

            stream.on("close", () => resolve({archive: archive, filename: out}));
            archive.finalize();
        });
    },
};

export default zipper;

import archiver from "archiver";
import fs from "fs";

const zipper = {
    async zipDirectory(source: string, out:string): Promise<void> {
        return this.zipDirectories([source], out);
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

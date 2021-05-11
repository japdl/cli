import fs from "fs";

const fsplus = {
    tellIfDoesntExist(locations: string[]): boolean {
        const found = [];
        locations.forEach((location) => {
            if (!fs.existsSync(location)) {
                console.log(
                    "Attention: le chapitre " +
                    location +
                    " n'a pas été trouvé sur votre disque."
                );
            } else {
                found.push({ location: location });
            }
        });
        console.log(`${found.length}/${locations.length} vont être ajoutés au zip`);
        return !!found.length;
    },
    mkdirIfDoesntExist(path: string): void {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    },
    createPath(_path: string): void {
        const split = _path.split("/");
        let path = "";
        split.forEach((folder: string) => {
            if (folder === "") return;
            path += folder + "/";
            this.mkdirIfDoesntExist(path);
        });
    },
};

export default fsplus;
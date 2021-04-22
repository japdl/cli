import Interface from "./interface";

import yargs from "yargs";


const flags = yargs(process.argv.slice(2))
    .option("v", { alias: "verbose", boolean: true, default: false })
    .option("h", { alias: "headless", boolean: true, default: false })
    .option("f", { alias: "fast", boolean: true, default: false })
    .option("t", {alias: "timeout", number:true, default: 60})
    .argv;

if (flags.f) {
    console.log("Attention! Le flag 'fast' est activé. Le programme ne garantit plus de récupérer toutes les images des chapitres. Une bonne connexion et un bon ordinateur est très fortement recommandé pour l'utilisation de ce flag. Dans le cas contraire, des images pourraient manquer.");
}
console.log(flags);
const inter = new Interface(flags);
inter.onready.then(() => {
    inter.start();
}).catch((error) => {
    console.log(error);
    process.exit(1);
});
// */
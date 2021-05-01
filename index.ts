import Interface from "./src/interface";

const inter = new Interface();
inter.onready.then(() => {
    inter.start();
}).catch((error) => {
    console.log(error);
    process.exit(1);
});
// */
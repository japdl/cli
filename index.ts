//import GUIInterface from "./src/GUIInterface"; const inter = new GUIInterface();
import CLInterface from "./src/CLIInterface"; const inter = new CLInterface();

inter.onready.then(() => {
    inter.start();
}).catch((error) => {
    console.log(error);
    process.exit(1);
});
// */
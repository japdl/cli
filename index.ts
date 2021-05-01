//import GUIInterface from "./src/GUIInterface"; const inter = new GUIInterface();
import CLIInterface from "./src/CLIInterface"; const inter = new CLIInterface();

inter.onready.then(() => {
    inter.start();
}).catch((error) => {
    console.log(error);
    process.exit(1);
});
// */
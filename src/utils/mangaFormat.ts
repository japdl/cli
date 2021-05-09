const volumeAliases = ["volume", "vol", "v"];
const chapterAliases = ["chapitre", "chap", "c"];
const formats = [volumeAliases, chapterAliases];
function returnFullFormat(_format: string): "volume" | "chapitre" | false {
    for(const format of formats){
        if(format.includes(_format)){
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            return format[0];
        }
    }
    return false;
}

function stringError(badFormat: string): string {
    let buffer = "";
    buffer += "japdl ne peut pas télécharger de '" + badFormat + "', il ne peut télécharger que:\n";
    formats.forEach((types) => types.forEach((type) => {
        buffer += `- '${type}'\n`;
    }));
    return buffer;
}
export default {
    formats: formats,
    returnFullFormat: returnFullFormat,
    stringError:stringError
}
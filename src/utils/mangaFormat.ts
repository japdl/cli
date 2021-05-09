const acceptedFormats = ["volume", "chapitre"];
function returnFullFormat(_format: string): "volume" | "chapitre" | false {
    for(const format of acceptedFormats){
        if(format.startsWith(_format)){
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            return format;
        }
    }
    return false;
}

function stringError(badFormat: string): string {
    let buffer = "";
    buffer += "japdl ne peut pas télécharger de '" + badFormat + "', il ne peut télécharger que des:\n";
    const options: string[] = [];
    acceptedFormats.forEach((format) => {
        let optionBuffer = "";
        Array.from(format).forEach((letter) => {
            optionBuffer += letter;
            options.push(optionBuffer);
        });
    })

    options.forEach((type)  => {
        buffer += `- '${type}'\n`;
    });
    return buffer;
}
export default {
    returnFullFormat: returnFullFormat,
    stringError:stringError
}
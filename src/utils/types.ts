import CLIInterface from "../CLIInterface";

export interface MangaAttributes {
    manga: string;
    chapter: string;
    page: string;
}

export interface MangaInfos {
    volumes: number;
    chapters: number;
    name: string;
}

export interface CLICommand {
    description: string;
    usage: string;
    aliases: string[];
    example: string[];
    argsNeeded: number;
    execute(inter: CLIInterface, args: string[]): Promise<void>;
}

export type DownloaderOnPage =
    (attributes: MangaAttributes,
        currentPage: number,
        totalPages: number) => void;

export type DownloaderOnChapter = (attributes: MangaAttributes, currentChapter: number, totalChapters: number) => void;

export type DownloaderOnVolume = (mangaName: string, current:number, total:number) => void;
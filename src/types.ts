interface MangaAttributes {
    manga: string;
    chapter: string;
    page: string;
}

interface ConfigVariables {
    chromePath: string;
    outputDirectory: string;
}

interface MangaRange {
    start: number;
    end: number;
}

interface MangaStats {
    volumes: number,
    chapters: number,
    name: string
}
// https://github.com/facebook/flow/issues/1192 - build script guarantees SPORT is never null or undefined
declare class process {
    static argv: string[];

    static env: {
        SPORT: string,
        [string]: ?string,
    };

    static exit(code: number): void;

    static hrtime(time?: [number, number]): [number, number];
}

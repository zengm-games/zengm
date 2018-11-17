// https://github.com/facebook/flow/issues/1192 - build script guarantees SPORT is never null or undefined
declare class process {
    static env: {
        SPORT: string,
        [string]: ?string,
    };

    static hrtime(time?: [number, number]): [number, number];
}

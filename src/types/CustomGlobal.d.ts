export {};

declare global {
    namespace NodeJS {
        interface Global {
            windowOpen: boolean;
            globalObj: any;
        }
    }
}

declare namespace NodeJS {
    interface ProcessEnv {
        appVersion: string;
        userDataPath: string;
        infoPath: string;
        confPath :string;
        inputFilePath:string;
        imagesDirPath:string;
        logFilePath:string;
    }
}

import type { Config } from "jest";

const config: Config = {
    // cacheDirectory: path.join(brazil.tmpDir, "jestCache"),
    clearMocks: true,
    // reporters: [
    //     "default",
    //     [
    //         "jest-html-reporters",
    //         {
    //             publicPath: brazil.testOutputDir,
    //             filename: "index.html"
    //         }
    //     ]
    // ],
    collectCoverage: true,
    collectCoverageFrom: ["**/*.{ts,tsx}", "!**/*.json"],
    coverageDirectory: "./coverage",
    coverageReporters: ["cobertura", "text", "lcov"],
    displayName: "DAB-ADB-BRIDGE - Tests",
    globals: {
        "ts-jest": {
            isolatedModules: true,
            tsconfig: "./tsconfig.json"
        }
    },
    // rootDir: "src",
    moduleFileExtensions: ["js", "ts", "tsx", "json"],
    modulePaths: ["/node_modules"],
    // setupFilesAfterEnv: ["jest-extended", "<rootDir>/setupJestAfterEnv.ts"],
    // setupFiles: ["<rootDir>/setupJest.js"],
    testRegex: "/__tests__/.*\\.test\\.(ts|tsx)$",
    transform: {
        ".(ts|tsx)": "ts-jest"
    },
    testPathIgnorePatterns: ["<rootDir>/dist", "<rootDir>/node_modules/"],
    transformIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/"],
    verbose: true,
    restoreMocks: true
};

export default config;

module.exports = {
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"],
    env: {
        node: true,
        es6: true,
        jest: true
    },
    ignorePatterns: ["*.md", "*.json", "*.js", "dist/"],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "jsdoc", "prettier", "jest"],
    parserOptions: {
        ecmaFeatures: {
            modules: true
        },
        project: "./tsconfig.json"
    },
    rules: {
        eqeqeq: "error",
        "jest/no-focused-tests": "error",
        "jsdoc/check-alignment": "error",
        "jsdoc/newline-after-description": "error",
        "prettier/prettier": "error",
        "@typescript-eslint/array-type": [
            "error",
            {
                default: "array-simple"
            }
        ],
        "@typescript-eslint/consistent-type-definitions": "error",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/member-ordering": ["error", { default: ["signature", "field", "constructor", "method"] }],
        "@typescript-eslint/naming-convention": [
            "error",
            {
                selector: "typeLike",
                format: ["PascalCase"]
            },
            {
                selector: "interface",
                format: ["PascalCase"],
                custom: {
                    regex: "^I[A-Z]",
                    match: false
                }
            },
            {
                selector: "enum",
                format: ["PascalCase"],
                custom: {
                    regex: "^I[A-Z]",
                    match: false
                }
            },
            {
                selector: "variableLike",
                format: ["camelCase"]
            },
            {
                selector: "variableLike",
                modifiers: ["unused"],
                leadingUnderscore: "allow",
                format: ["camelCase"]
            },
            {
                selector: "variable",
                modifiers: ["const"],
                format: ["camelCase", "UPPER_CASE"]
            },
            {
                selector: "method",
                format: ["camelCase"]
            },
            {
                selector: "classProperty",
                format: ["camelCase"]
            },
            {
                selector: "classProperty",
                modifiers: ["static", "readonly"],
                format: ["camelCase", "UPPER_CASE"]
            }
        ],
        "@typescript-eslint/no-unused-vars": ["error", { varsIgnorePattern: "^_", argsIgnorePattern: "^_" }],
        "@typescript-eslint/prefer-for-of": "error",
        "@typescript-eslint/prefer-function-type": "error",
        "@typescript-eslint/unified-signatures": "error",
        "@typescript-eslint/no-empty-function": "error",
        "@typescript-eslint/no-floating-promises": "error"
    }
};

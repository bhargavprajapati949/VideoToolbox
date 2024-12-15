import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  { 
    languageOptions: { 
      globals: globals.node,
      ecmaVersion: 'latest',
      sourceType: 'module'
    }
  },
  pluginJs.configs.recommended,
  {
    files: ["**/*.test.js", "**/*.spec.js"],
    languageOptions: {
      globals: globals.jest,
    }
  },
];

import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  {
    ignores: [".next/**/*"],
  },
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "plugin:react/recommended",
    "plugin:prettier/recommended",
  ),
  {
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React 17+ handles JSX runtime automatically in Next.js.
      "react/react-in-jsx-scope": "off",
    },
  },
]

export default eslintConfig

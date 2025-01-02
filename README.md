# WOT-terms-to-Spec-Up-T

## General info

This is a tool to convert WOT terms to Spec-Up-T

## How to use

- To import meta data from an external source, add this code snippet below locally to .env file (or create from the ".env.example") of the target repo for your glossary to be, supposing you had already created this repo:

```bash
#===BEGIN===
# WOT MANAGE GOOGLE SHEET JSON ENDPOINT
TERMS_WOT_MANAGE_JSON_ENDPOINT="*****”
TERMS_WOT_MANAGE_JSON_DIR_NAME=”./output/”
TERMS_WOT_MANAGE_JSON_FILE_NAME="metadata.json”
#===END===
```

Replace “*****” with a valid Google Sheet Key (ask someone who has gone through the procedure of obtaining a key).

> **Warning**
> Check that the .env file is in the .gitignore

- To be able to convert your own terminology into a Spec-Up-T valid terminology, install the  conversion package in the root of your target repo:

```bash
npm install wottermstospecupt
```

- Add two entries to your `scripts` section in `package.json`:

```json
"convert": "node -e \"import('wottermstospecupt/scripts/index.mjs')\"",
"fetch": "node -e \"import('wottermstospecupt/scripts/fetchGoogleSheetContent.mjs')\""
```

You should get this (“…” is the rest of the script section):

```json
"scripts": {
    …
    "convert": "node -e \"import('wottermstospecupt/scripts/index.mjs')\"",
    "fetch": "node -e \"import('wottermstospecupt/scripts/fetchGoogleSheetContent.mjs')\""
    …
  }
```

- Run the render option at least once:
  
```bash
npm run menu
```

Choose option 1 (render)

- Fetch meta info:
  
```bash
npm run fetch
```

- Do the conversion

```bash
npm run convert
```

- Start menu

```bash
npm run menu
```

- Choose option 1 (render)

Now you should have an index.html. If you didn't get any error messages along the way.

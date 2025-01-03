# WOT-terms-to-Spec-Up-T

## General info

This is a tool to convert WOT terms to Spec-Up-T

## Starting situation

Requirements:

- A local clone of your GitHub Wiki that is in a clean state. By this, we mean that when you query Git status (via `git status`), you read, “Nothing to commit.”
- A Spec-Up-T installation that will host the definitions you extract from the wiki. You can install this via [add a link to docu site].

## How to use: overview

This script has an input part and an output part.

The input is:

- A GitHub wiki directory

The output is:

- new files in the directory `/spec/terms-definitions/` (or another location if you deliberately set it that way)
- a directory called “newWikiFiles”, which contains the edited wiki files, which you have to bring back to the wiki
- a directory called `/backupWikiFiles`, which you do not have to do anything with, just to be safe

## How to use: detailed

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
    "fetch": "node -e \"import('wottermstospecupt/scripts/fetchGoogleSheetContent.mjs')\"",
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

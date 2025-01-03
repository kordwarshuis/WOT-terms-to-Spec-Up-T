# WOT-terms-to-Spec-Up-T

## General info

This is a tool to convert WOT terms to Spec-Up-T
More generic: This is a tool that ...

This script uses Spec-Up-T, see [documentation about Spec-Up-T](https://trustoverip.github.io/spec-up-t-website/).

## Starting situation

Requirements:

- A local clone of your GitHub Wiki that is in a clean state. By this, we mean that when you query Git status (via `git status`), you read, “Nothing to commit.”
- A Google Sheet that holds meta data about the terms in the Wiki
- A Spec-Up-T installation that will host the definitions you extract from the wiki. [Installation Instructions](https://trustoverip.github.io/spec-up-t-website/docs/general/installation)
- an NPM package called `wottermstospecupt` that you will install in the above mentioned Spec-Up-T installation

## How to use: overview

This script has an input part and an output part.

The input is:

- a GitHub wiki directory

The output is:

- new files in the directory `/spec/terms-definitions/` (or another location if you deliberately set it that way)
- a directory called “newWikiFiles”, which contains the edited wiki files, which you have to bring back to the wiki
- a directory called `/backupWikiFiles`, this is purely a copy for security.

## How to use: detailed

- To import meta data from an external source (in this case the Google Sheet containing meta data), add this code snippet below locally to .env file (or create from the ".env.example") of the target repo for your glossary to be, supposing you had already created this repo:

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

- Add two entries to your `scripts` section in `package.json` (the order of the entries doesn't matter, put it anywhere you like):

```json
"convert": "node -e \"import('wottermstospecupt/scripts/index.mjs')\"",
"fetch": "node -e \"import('wottermstospecupt/scripts/fetchGoogleSheetContent.mjs')\""
```

You should get this:

```json
"scripts": {
    // ... other scripts ...
    "convert": "node -e \"import('wottermstospecupt/scripts/index.mjs')\"",
    "fetch": "node -e \"import('wottermstospecupt/scripts/fetchGoogleSheetContent.mjs')\"",
    // ... other scripts ...
  }
```

- Run the render option at least once (This step is still necessary now but will disappear in the future):
  
```bash
npm run menu
```

Choose option 1 (render)

- Fetch meta info:
  
```bash
npm run fetch
```

You only need to repeat this step above if you change something in the metadata. If you don't, there is a copy in your Start-Up-T installation that will be used every time you run `npm run convert` again (see next step).

The reason why you need to fetch again is, that the resulting terminology must come in sync with your latest changes to the meta data and instructional data in JSON.

- Do the conversion

```bash
npm run convert
```

- Start menu

```bash
npm run menu
```

- Choose option 1 (render)

## Results

If everything went as planned, you should now have the following:

- a `/spec/terms-definitions/` directory containing definition files
- a `docs/index.html` file containing a specification with the terms extracted from the Wiki
- a `/newWikiFiles` directory containing new Wiki files from which the definition has been extracted and containing links pointing to the new specification (TODO: the links are now hard-coded for a specific situation, this needs to be changed)



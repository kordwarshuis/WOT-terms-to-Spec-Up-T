# WOT-terms-to-Spec-Up-T

## General info

This is a tool to convert WOT terms to Spec-Up-T
More generic: This is a tool that ...

This script uses Spec-Up-T, see [documentation about Spec-Up-T](https://trustoverip.github.io/spec-up-t-website/).

## Initial situation

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

### Add info to `.env`

To import meta data from an external source (in this case the Google Sheet containing meta data), add this code snippet below locally to the `.env` file (or create from the `.env.example`) of the target repo for your glossary to be, supposing you had already created this repo.

This is the content to be added to the `.env` file:

```bash
#=== BEGIN FETCHING INFO FROM GOOGLE SHEET ===
# WOT MANAGE GOOGLE SHEET JSON ENDPOINT
TERMS_WOT_MANAGE_JSON_ENDPOINT=******
TERMS_WOT_MANAGE_JSON_DIR_NAME=./output/
TERMS_WOT_MANAGE_JSON_FILE_NAME=metadata.json
#=== END FETCHING INFO FROM GOOGLE SHEET ===
```

Replace “*****” with a valid Google Sheet Key (ask someone who has gone through the procedure of obtaining a key).

> **Warning**
> Double check that the .env file is in the .gitignore since you do not want secret information visible on GitHub.

### Install `wottermstospecupt`

To be able to convert your own terminology into a Spec-Up-T valid terminology, install the  conversion package in the root of your target repo:

```bash
npm install wottermstospecupt
```

### Add entries to `scripts` in `package.json`

Add two entries to your `scripts` section in `package.json` (the order of the entries doesn't matter, put it anywhere you like):

```json
"convert": "node -e \"import('wottermstospecupt/scripts/index.mjs')\"",
"fetch": "node -e \"import('wottermstospecupt/scripts/fetchGoogleSheetContent.mjs')\""
```

This should be the endresult:

```json
"scripts": {
    // ... other scripts ...
    "convert": "node -e \"import('wottermstospecupt/scripts/index.mjs')\"",
    "fetch": "node -e \"import('wottermstospecupt/scripts/fetchGoogleSheetContent.mjs')\"",
    // ... other scripts ...
  }
```

### Run `render`

Run the render option at least once (This step is still necessary now but will disappear in the future).

You will run the render option by starting the menu:
  
```bash
npm run menu
```

You will see several menu entries. Choose option 1 (render).

### Fetch meta info:

Now fetch the meta-date via the following command:

```bash
npm run fetch
```

You only need to repeat this step above if you change something in the metadata. Only the latest copy fetched in your Start-Up-T installation will be used every time you repeat the next steps, like `npm run convert`

The reason why you need to fetch again is, that the resulting terminology must come in sync with your latest changes to the meta data and instructional data in JSON.

### Do the conversion

The conversion takes the Wiki files, grabs the first paragraph (the definition) in each file, places it in the Spec-Up-T specification with a link to the Wiki, and also takes the definition from the Wiki file and adds a link to the Spec-Up-T specification with each term.

```bash
npm run convert
```

### Render the specification

All the info is there now; only a result file (the `index.html`) needs to be created.

You will run the render option by starting the menu:

```bash
npm run menu
```

You will see several menu entries. Choose option 1 (render).

There should be an `index.html` in the `docs/` directory. This is the specification that can be viewed. One way to view it is to double click on it to open it in a browser.

## Results

If everything went as planned, you should now have the following (after running a few times):

```
docs
  |_ index.html

sourceFilesConverted
  |_ archive
     |_ 1736169814
         term1.md
         term2.md
         term3.md
     |_ 1736169976
         term1.md
         term2.md
         term3.md
     |_ initialBackup
         term1.md
         term2.md
         term3.md
  |_ latest
      term1.md
      term2.md
      term3.md

spec
  |_ terms-definitions
      term1.md
      term2.md
      term3.md
```


- a `/spec/terms-definitions/` directory containing definition files
- a `docs/index.html` file containing a specification with the terms extracted from the Wiki
- a `/sourceFilesConverted` directory containing new source files from which the definition has been extracted and containing links pointing to the new specification (TODO: the links are now hard-coded for a specific situation, this needs to be changed)
- Inside `/sourceFilesConverted` you'll find a `latest` directory which contains the latest conversion, and an `archive` directory that contains a one time backup directory (`initialBackup`) and conversions made earlier (each in a directory consisting of a number, which is a Unix timestamp, for example `1736169814`).

## Troubeshooting

- Make sure you did not use quotes around the values in the `.env` file:

Good:
`TERMS_WOT_MANAGE_JSON_FILE_NAME=metadata.json`

Wrong:
`TERMS_WOT_MANAGE_JSON_FILE_NAME="metadata.json"`

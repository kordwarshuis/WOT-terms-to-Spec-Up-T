# WOT-terms-to-Spec-Up-T

## General info

This is a tool to convert WOT terms to Spec-Up-T
More generic: This is a tool that ...

This script uses Spec-Up-T, see [documentation about Spec-Up-T](https://trustoverip.github.io/spec-up-t-website/).

## Initial situation

Requirements:

- **Source files**. Example: A local clone of your GitHub Wiki that is in a clean state. By this, we mean that when you query Git status (via `git status`), you read, “Nothing to commit.” Be sure to git fetch & git merge or git pull your latest source version from github.com or locally if maintained locally
- A **Google Sheet** that holds meta data about the terms in the source
- A **Spec-Up-T installation** that will host the definitions you extract from the source. [Installation Instructions](https://trustoverip.github.io/spec-up-t-website/docs/general/installation)
- an NPM package called `wottermstospecupt` that you will install in the above mentioned Spec-Up-T installation

## How to use: overview

This script has an input part and an output part.

The input is:

- a source directory

The output is (in your Spec-Up-T installation):

- new files in the directory `/spec/terms-definitions/` (or another location if you deliberately set it that way)
- a directory called “sourceFilesConverted” (or a name of your choice, see the `.env` part below), which contains the edited source files, which you have to bring back to the source

## How to use: detailed

### Add info to `.env`

To import meta data from an external source (in this case the Google Sheet containing meta data), add this code snippet below locally to the `.env` file (or create from the `.env.example`) of the target repo for your glossary to be, supposing you had already created this repo.

This is the content to be added to the `.env` file:

```bash
#=== BEGIN FETCHING INFO FROM GOOGLE SHEET ===
# WOT MANAGE GOOGLE SHEET JSON ENDPOINT
WOTTERMSTOSPECUPT_JSON_ENDPOINT=*****

WOTTERMSTOSPECUPT_OUTPUT_DIR=sourceFilesConverted
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
"fetch": "node -e \"import('wottermstospecupt/scripts/fetchGoogleSheetContent.mjs')\"",
"convert": "node -e \"import('wottermstospecupt/scripts/index.mjs')\"",
"create-repo": "node -e \"import('wottermstospecupt/scripts/create-repo.js')\""
```

This should be the endresult:

```json
"scripts": {
    // ... other scripts ...
    "fetch": "node -e \"import('wottermstospecupt/scripts/fetchGoogleSheetContent.mjs')\"",
    "convert": "node -e \"import('wottermstospecupt/scripts/index.mjs')\"",
    "create-repo": "node -e \"import('wottermstospecupt/scripts/create-repo.js')\""
    // ... other scripts ...
  }
```

> **Warning**
> Make sure that there is a comma at the end of each entry, except for the last one



### Fetch meta info

Now fetch the meta info (also called `metadata`) via the following command:

```bash
npm run fetch
```

You only need to repeat this step above if you change something in the metadata. Only the latest copy fetched in your Start-Up-T installation will be used every time you repeat the next steps, like `npm run convert`

The reason why you need to fetch again is, that the resulting terminology must come in sync with your latest changes to the meta data and instructional data in JSON.

### Do the conversion

Before you start: be sure to git fetch & git merge or git pull your latest source version from github.com or locally if maintained locally.

The conversion takes the source files, grabs the first paragraph (the definition) in each file, places it in the Spec-Up-T specification with a link to the source, and also takes the definition from the source file and adds a link to the Spec-Up-T specification with each term.

```bash
npm run convert
```

There should be an `index.html` in the `docs/` directory. This is the specification that can be viewed. One way to view it is to double click on it to open it in a browser.

## Results

If everything went as planned, you should now have the following (after running a few times):

```bash
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
  |_ metadata.json

spec
  |_ terms-definitions
      term1.md
      term2.md
      term3.md
```

- a `/spec/terms-definitions/` directory containing definition files **(Standard Spec-Up-T directory)**
- a `/docs/index.html` file containing a specification with the terms extracted from the source **(Standard Spec-Up-T directory)**
- a `/sourceFilesConverted` *) directory containing new source files from which the definition has been extracted and containing links pointing to the new specification (TODO: the links are now hard-coded for a specific situation, this needs to be changed)
- Inside `/sourceFilesConverted` you'll find a `latest` directory which contains the latest conversion, and an `archive` directory that contains a one time backup directory (`initialBackup`) and conversions made earlier (each in a directory consisting of a number, which is a Unix timestamp, for example `1736169814`) and `metadata.json`, which contains the metadata fetched from Google Sheets

*) The name `/sourceFilesConverted` is defined in the `.env` file and can anything you want, as long as the directory does not exist yet.

## How to use the results

### `/docs/index.html`

This is the file to be hosted on your GitHub Pages, or somewhere else on a domain.

### `/sourceFilesConverted/latest`

These files are the modified files from your original source (for example a GitHub Wiki). You can move these to the original source.

## Publishing to GitHub

To get this repo on GitHub you can use the following command:

```bash
npm run create-repo
```

You will first be shown information and then given the chance to enter your data.

## How to go on from here

You now have a local repo posted to GitHub with generated content.

When customizing content, you should do the following:

```bash
npm run menu
```

You will see several menu entries. Choose option 1 (render).

The `index.html` will be recreated. To get the changes online use the `git push` command:

```bash
git push
```

## Troubeshooting

### Wrong directory?

Make sure you are in the root of your project and not in a subdirectory, or outside your project directory.

### Quotes in `.env`?

Make sure you did not use quotes around the values in the `.env` file:

Good:
`WOTTERMSTOSPECUPT_OUTPUT_DIR=sourceFilesConverted`

Wrong:
`WOTTERMSTOSPECUPT_OUTPUT_DIR="sourceFilesConverted"`

### Things to check

- enough user rights?
- right Google access token?
- internet working?
- firewalls blocking?
- corrupted meta data (columns inserted, column names changed, etc )

## FAQ

### Can I safely delete the `sourceFilesConverted` directory?

Yes, no problem. You can always start again.

# WOT-terms-to-Spec-Up-T

## General info

This is a tool to convert WOT terms to Spec-Up-T

## How to use

- Add this to .env file of the target repo you had already created:

GITHUB_API_TOKEN=YOUR_GITHUB_API_TOKEN

```
#===BEGIN .ENV===
# WOT MANAGE GOOGLE SHEET JSON ENDPOINT
TERMS_WOT_MANAGE_JSON_ENDPOINT="-----”
TERMS_WOT_MANAGE_JSON_DIR_NAME=”./output/”
TERMS_WOT_MANAGE_JSON_FILE_NAME="metadata.json”
#===END .ENV===
```

- Install pieced together conversion package:
$ npm install wottermstospecupt

- Add two entries to your “scripts” section in package.json

```bash
“convert“: ‘node -e ″import(’wottermstospecupt/scripts/index.mjs')″”,
“fetch": ‘node -e ″import(’wottermstospecupt/scripts/fetchGoogleSheetContent.mjs')″”
```

- Run the render option at least once
`$ npm run menu`
Choose option 1 (render)

- Fetch meta info:
`$ npm run fetch`

- Do the conversion
`$ npm run convert`

$ npm run menu
Choose option 1 (render)

Now you should have an index.html. If you didn't get any error messages along the way.
#!/usr/bin/env node

/*
  Author: Kor Dwarshuis
  Created: 2023
  Updated: -
  Description: 


*/

import fs, { existsSync } from 'fs';
import path, { join } from 'path';
import https from 'https';
import { config } from 'dotenv';
config();
import { showLinkToDocumentation } from './modules/showLinkToDocumentation.mjs';


// This script should be run from the root of the project, let's check if we are in the right directory
const isRoot = existsSync(join(process.cwd(), 'package.json'));

if (!isRoot) {
    console.error('\nThis script should be run from the root of the project\nPlease go to the root of the project and try again.\n');
    process.exit(1);
}

showLinkToDocumentation();

// CONFIG
// How to create JSON endpoint from Google Sheet: https://stackoverflow.com/a/68854199
const url = process.env.WOTTERMSTOSPECUPT_JSON_ENDPOINT;
console.log('\nThe data will be fetched from this url:', url);

const outputDirJSON = process.env.WOTTERMSTOSPECUPT_OUTPUT_DIR;
console.log('\nThe output will be saved to:', outputDirJSON);

const outputFileNameJSON = "metadata.json";
console.log('\nThe output will be saved in a file called:', outputFileNameJSON);

https
    .get(url, (resp) => {
        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            let oData = JSON.parse(data);
            let strData = JSON.stringify(oData);
            writeJSONFile(strData);
        });
    })
    .on('error', (err) => {
        console.log('Error: ' + err.message);
    });

function writeJSONFile(content) {
    // Create the output directory if it doesn't exist
    if (!fs.existsSync(outputDirJSON)) {
        fs.mkdirSync(outputDirJSON, { recursive: true });
    }

    // Write the first 300 characters of the content to the console
    console.log('\nHere is the first 300 characters of the content:\n', content.slice(0, 300));

    // Path to the output file
    const filePath = path.join(outputDirJSON, outputFileNameJSON);
    console.log('This will be written to: ', filePath);

    fs.writeFile(filePath, content, function (err) {
        if (err) {
            return console.log(err);
        }
        console.log('\nJSON file has been written successfully.');
    });
} // End writeJSONFile

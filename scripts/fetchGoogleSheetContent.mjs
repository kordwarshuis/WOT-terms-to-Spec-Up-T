#!/usr/bin/env node

/*
  Author: Kor Dwarshuis
  Created: 2023
  Updated: -
  Description: 


*/


// This script should be run from the root of the project

import fs from 'fs';
import path from 'path';
import https from 'https';
import { config } from 'dotenv';
config();

// CONFIG
// How to create JSON endpoint from Google Sheet: https://stackoverflow.com/a/68854199
const url = process.env.TERMS_WOT_MANAGE_JSON_ENDPOINT;
console.log('The data will be fetched from this url:', url);

const outputDirJSON = process.env.TERMS_WOT_MANAGE_JSON_DIR_NAME;
console.log("The output will be saved to:", outputDirJSON);

const outputFileNameJSON = process.env.TERMS_WOT_MANAGE_JSON_FILE_NAME;
console.log('The output will be saved in a file called:', outputFileNameJSON);

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

    // Path to the output file
    const filePath = path.join(outputDirJSON, outputFileNameJSON);

    fs.writeFile(
        filePath,
        content,
        function (err) {
            if (err) {
                return console.log(err);
            }
            console.log('JSON file has been written successfully.');
        }
    );
} // End writeJSONFile

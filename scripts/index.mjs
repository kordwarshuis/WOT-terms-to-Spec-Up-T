import { readFileSync, appendFile } from 'fs';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra'; // Assuming you are using fs-extra for readJsonSync
import processFilesInDirectory from "./modules/processFilesInDirectory.mjs";


const config = fs.readJsonSync('./output/specs-generated.json');
const termsdir = path.join(config.specs[0].spec_directory, config.specs[0].spec_terms_directory)
console.log('termsdir: ', termsdir);


const appendFileAsync = promisify(appendFile);

const googlesheet = readFileSync('./output/metadata.json', 'utf8');
const googlesheetValues = JSON.parse(googlesheet).values;


const ToIP_Fkey = googlesheetValues[0].indexOf('ToIP_Fkey');
let allToIP_FkeyValues = [];
let numberOfMissingMatches = 0;
console.log('ToIP_Fkey: ', ToIP_Fkey);
// loop through all the rows fourth column
googlesheetValues.forEach((row, index) => {
    if (index > 0) {
        const ToIP_FkeyValue = row[ToIP_Fkey];
        // console.log('ToIP_FkeyValue: ', ToIP_FkeyValue);
        allToIP_FkeyValues.push(ToIP_FkeyValue);
        // const fileName = ToIP_FkeyValue + '.md';
        // console.log('fileName: ', fileName);
    }
});


// Example usage:
// Define a function to run on each file
async function exampleFunction(filePath) {
    try {
        await appendFileAsync(filePath, ' pipo');

        // show only the file name
        const fileNameWithExt = filePath.split('/').pop();
        const fileName = fileNameWithExt.split('.')[0];


        // console.log('fileName: ', fileName);
        // allFiles.push(fileName);

        // test if file is in allToIP_FkeyValues
        const fileInToIP_FkeyValues = allToIP_FkeyValues.includes(fileName);
        // console.log('fileInToIP_FkeyValues: ', fileInToIP_FkeyValues);
        // if fileInToIP_FkeyValues is false, then increment numberOfMissingMatches
        if (!fileInToIP_FkeyValues) {
            numberOfMissingMatches++;
        }

        // console.log(`Successfully appended to file: ${filePath}`);
    } catch (err) {
        console.error(`Error appending to file: ${filePath}`, err);
    }
}

// Call the processFilesInDirectory function
const directoryPath = './specsource';
const fileExtension = '.md';

(async () => {
    await processFilesInDirectory(directoryPath, fileExtension, exampleFunction);
    console.log('numberOfMissingMatches: ', numberOfMissingMatches);
})();


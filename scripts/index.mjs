import { readFileSync, appendFile } from 'fs';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra'; // Assuming you are using fs-extra for readJsonSync
import processFilesInDirectory from "./modules/processFilesInDirectory.mjs";
const config = fs.readJsonSync('./output/specs-generated.json');
const termsdir = path.join(config.specs[0].spec_directory, config.specs[0].spec_terms_directory)
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
        allToIP_FkeyValues.push(ToIP_FkeyValue);
    }
});


// Example usage:
// Define a function to run on each file
async function exampleFunction(filePath) {
    try {
        const fileContent = readFileSync(filePath, 'utf8');
        const newFilePath = path.join(termsdir, path.basename(filePath));
        await appendFileAsync(newFilePath, fileContent + ' pipo');
        console.log(`Successfully appended to file: ${newFilePath}`);


        // show only the file name
        const fileNameWithExt = filePath.split('/').pop();
        const fileName = fileNameWithExt.split('.')[0];

        // test if file is in allToIP_FkeyValues
        const fileInToIP_FkeyValues = allToIP_FkeyValues.includes(fileName);
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


import { readFileSync, appendFile } from 'fs';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra'; // Assuming you are using fs-extra for readJsonSync
import processFilesInDirectory from "./modules/processFilesInDirectory.mjs";


/* CONFIG */
const sourceDirectoryPath = './specsource';
const fileExtension = '.md';
const googlesheet = readFileSync('./output/metadata.json', 'utf8');
const config = fs.readJsonSync('./output/specs-generated.json');
const termsdir = path.join(config.specs[0].spec_directory, config.specs[0].spec_terms_directory);
/* END CONFIG */

const appendFileAsync = promisify(appendFile);
const googlesheetValues = JSON.parse(googlesheet).values;
const indexOfToIP_Fkey = googlesheetValues[0].indexOf('ToIP_Fkey');
const indexOfAlias = googlesheetValues[0].indexOf('Alias');
let allToIP_FkeyValues = [];
let numberOfMissingMatches = 0;

googlesheetValues.forEach((row, index) => {
    if (index > 0) {
        const ToIP_FkeyValue = row[indexOfToIP_Fkey];
        allToIP_FkeyValues.push(ToIP_FkeyValue);
    }
});

function isAliasTrue(fName) {
    let aliasValue = false;

    // Iterate over each row in googlesheetValues, will not stop until the end of the array. forEach is not designed to be stoppable. It always iterates through all elements in the array.
    googlesheetValues.forEach((row, index) => {
        // Skip the header row
        if (index > 0) {
            // Check if the ToIP_Fkey column matches fName
            if (row[indexOfToIP_Fkey] === fName) {
                // Check if the alias column is 'y'
                if (row[indexOfAlias] === 'y') {
                    // Set aliasValue to true if both conditions are met
                    aliasValue = true;
                }
            }
        }
    });

    return aliasValue;
}

function replaceInternalMarkdownLinks(fileContent) {
    // Regular expression to match internal markdown links
    const internalLinkRegex = /\[([^\]]+)\]\((?!http)([^)]+)\)/g;

    // Replace the markdown links with the desired format
    const updatedContent = fileContent.replace(internalLinkRegex, (match, p1, p2) => {
        return `[[ref: ${p2}]]`;
    });

    return updatedContent;
}

// Example usage:
// Define a function to run on each file
async function convertFiles(filePath) {
    try {

        // show only the file name
        const fileNameWithExt = filePath.split('/').pop();
        const fileNameWithoutExt = fileNameWithExt.split('.')[0];

        // test if file is in allToIP_FkeyValues
        const fileInToIP_FkeyValues = allToIP_FkeyValues.includes(fileNameWithoutExt);


        /* IF ( ToIP_Fkey matcht met een .md file in de TermsDir met exact dezelfde naam ) THEN
	        File onder exact dezelfde naam wegschrijven naar directory TermsDirResult 
        */
        if (fileInToIP_FkeyValues) {
            const fileContent = readFileSync(filePath, 'utf8');
            const newFilePath = path.join(termsdir, path.basename(filePath));
            if (isAliasTrue(fileNameWithoutExt)) {
                console.log(fileNameWithoutExt, ": ", isAliasTrue(fileNameWithoutExt));
            }
            // Replace internal markdown links with the Spec-Up-T reference format
            await appendFileAsync(newFilePath, replaceInternalMarkdownLinks(fileContent));
            // console.log(`Successfully converted file: ${newFilePath}`);

        } else {
            console.log(`File not found in ToIP_Fkey: ${fileNameWithoutExt}`);
            numberOfMissingMatches++;

        }

        // console.log(`Successfully appended to file: ${filePath}`);
    } catch (err) {
        console.error(`Error appending to file: ${filePath}`, err);
    }
}

(async () => {
    await fs.emptyDir(termsdir);
    await processFilesInDirectory(sourceDirectoryPath, fileExtension, convertFiles);
    console.log(`**************\n\nHouston, we have ${numberOfMissingMatches} problems\n\n**************`);
})();


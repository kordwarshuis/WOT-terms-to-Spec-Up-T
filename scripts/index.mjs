import { readFileSync, appendFile } from 'fs';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra'; // Assuming you are using fs-extra for readJsonSync
import processFilesInDirectory from "./modules/processFilesInDirectory.mjs";
import readline from 'readline';

let sourceDirectoryPath = '';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('\n\n\n********************\nPlease enter the source directory path.\nThis can be a relative path (to this repo) or absolute, starting from root of file system):\n\n', (input) => {
    sourceDirectoryPath = input;
    // console.log(`Source Directory Path: ${sourceDirectoryPath}`);
    rl.close();
    main();
});


function main() { 
    /* CONFIG */
    // const sourceDirectoryPath = './specsource';
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

    function removeMarkdownHeadings(markdown) {
        return markdown
            .split('\n') // Split the string into lines
            .map(line => {
                // Check if the line starts with '#' (indicating a heading)
                if (/^#+\s/.test(line)) {
                    // Remove the '#' symbols and treat it as a normal paragraph
                    return line.replace(/^#+\s*/, '');
                }
                return line; // Keep other lines as-is
            })
            .join('\n'); // Join the lines back together
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
                let fileContent = readFileSync(filePath, 'utf8');
                const newFilePath = path.join(termsdir, path.basename(filePath));

                if (isAliasTrue(fileNameWithoutExt)) {
                    /*
                        In de file zetten  [[def: term, alias]]  (term=de filenaam zonder .md. De Alias is die in het 'Term' field staat in de sheet)
                    */

                    // Conversion to Spec-Up-T: Add the [[def: term]] reference at the beginning of the file
                    fileContent = `[[def: ${fileNameWithoutExt}]]\n` + fileContent;
                } else {
                    /* 
                        anders [[def: term, alias]] (alias is de naam van de file zonder '-', door de '-' te vervangen door een spatie)
                    */

                    // Conversion to Spec-Up-T: Add the [[def: term]] reference at the beginning of the file
                    fileContent = `[[def: ${fileNameWithoutExt}]]\n` + fileContent;
                }

                // Conversion to Spec-Up-T: Replace internal markdown links with the Spec-Up-T reference format
                fileContent = replaceInternalMarkdownLinks(fileContent)
                // Conversion to Spec-Up-T: Remove markdown headings
                fileContent = removeMarkdownHeadings(fileContent);

                // Conversion to Spec-Up-T: Write the updated content to the new file
                await appendFileAsync(newFilePath, fileContent);
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



}



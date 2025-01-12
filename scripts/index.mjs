import { readFileSync, appendFile, existsSync } from 'fs';
import { promisify } from 'util';
import path, { join } from 'path';
import fs from 'fs-extra'; // Assuming you are using fs-extra for readJsonSync
import readline from 'readline';
import { config } from 'dotenv';
config();
import processFilesWithExtensionInDirectory from "./modules/processFilesWithExtensionInDirectory.mjs";
import makeCopyOfSourceFiles from "./modules/makeCopyOfSourceFiles.mjs";
import { showLinkToDocumentation } from './modules/showLinkToDocumentation.mjs';
import testIfOutputPathExists from './modules/testIfOutputPathExists.mjs';

import specUpT from 'spec-up-t';

let sourceDirectoryPath = '';

// This script should be run from the root of the project, let's check if we are in the right directory
const isRoot = existsSync(join(process.cwd(), 'package.json'));

if (!isRoot) {
    console.error('\nThis script should be run from the root of the project\nPlease go to the root of the project and try again.\n');
    process.exit(1);
}

showLinkToDocumentation();

(async () => {
    // Check if the output directory exists
    const outputExists = await testIfOutputPathExists();

    if (!outputExists) {
        if (typeof specUpT === 'function') {
            await new Promise((resolve, reject) => {
                try {
                    specUpT({ nowatch: true });
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        } else {
            console.error('specUpT is not defined or is not a function.');
            return;
        }
    }

    // Prompt the user for input after the async tasks are done
    promptForSourceDirectoryPath();
})();

function promptForSourceDirectoryPath() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question(
        '\n\n\n********************\n\nPlease enter the path to the source directory files.\n\nThis can be a relative path (to this repo) or absolute\n(starting from the root of your file system)\n\nWARNING: This will remove your existing terms first.\n\n********************\n\nPLEASE ENTER PATH (no quotes around it):',
        (input) => {
            sourceDirectoryPath = input;
            rl.close();
            main();
        }
    );
}



function main() {

    /* CONFIG */
    const fileExtension = '.md';
    const config = fs.readJsonSync('./output/specs-generated.json');
    const termsDir = path.join(config.specs[0].spec_directory, config.specs[0].spec_terms_directory);
    const outputMinusTermsDir = process.env.WOTTERMSTOSPECUPT_OUTPUT_DIR;
    const metadataJsonLocation = `./${outputMinusTermsDir}/metadata.json`;
    /* END CONFIG */

    if (!fs.existsSync(metadataJsonLocation)) {
        console.log(`Warning: The file ${metadataJsonLocation} does not exist. Run “npm run fetch” first, to fetch the metadata.`);
        return;
    }
    const jsonMetadata = readFileSync(metadataJsonLocation);

    const appendFileAsync = promisify(appendFile);
    const objMetadata = JSON.parse(jsonMetadata).values;
    const indexOfToIP_Fkey = objMetadata[0].indexOf('ToIP_Fkey');
    const indexOfAlias = objMetadata[0].indexOf('Alias');
    const indexOfTerm = objMetadata[0].indexOf('Term');
    let allToIP_FkeyValues = [];
    let numberOfMissingMatches = 0;

    objMetadata.forEach((row, index) => {
        if (index > 0) {
            const ToIP_FkeyValue = row[indexOfToIP_Fkey];
            allToIP_FkeyValues.push(ToIP_FkeyValue);
        }
    });

    function isAliasTrue(fName) {
        let aliasValue = false;

        // Iterate over each row in objMetadata, will not stop until the end of the array. forEach is not designed to be stoppable. It always iterates through all elements in the array.
        objMetadata.forEach((row, index) => {
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
    function findTermInObjMetadata(fName) {
        let term = '';

        // Iterate over each row in objMetadata, will not stop until the end of the array. forEach is not designed to be stoppable. It always iterates through all elements in the array.
        objMetadata.forEach((row, index) => {
            // Skip the header row
            if (index > 0) {
                // Check if the ToIP_Fkey column matches fName
                if (row[indexOfToIP_Fkey] === fName) {
                    term = row[indexOfTerm];
                }
            }
        });

        return term;
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

    // // A: Remove only the heading but keep the content
    // function removeMarkdownHeadings(markdown) {
    //     return markdown
    //         .split('\n') // Split the string into lines
    //         .map(line => {
    //             // Check if the line starts with '#' (indicating a heading)
    //             if (/^#+\s/.test(line)) {
    //                 // Remove the '#' symbols and treat it as a normal paragraph
    //                 return line.replace(/^#+\s*/, '');
    //             }
    //             return line; // Keep other lines as-is
    //         })
    //         .join('\n'); // Join the lines back together
    // }

    // B: Remove the heading and the content
    function removeMarkdownHeadings(fileContent) {
        return fileContent
            .split('\n') // Split the string into lines
            .filter(line => {
                // Check if the line starts with '#' (indicating a heading)
                return !/^#+\s/.test(line);
            })
            .join('\n'); // Join the lines back together
    }

    function removeEverythingAfterSecondHeading(fileContent) {
        const lines = fileContent.split('\n');
        let headingCount = 0;
        let result = [];

        for (let line of lines) {
            if (/^#+\s/.test(line)) {
                headingCount++;
                if (headingCount === 2) {
                    break;
                }
            }
            result.push(line);
        }

        const newContent = result.join('\n');
        return newContent;
    }

    function ensureNewlineAfterPattern(fileContent) {
        const pattern = '## See ';
        const lines = fileContent.split('\n');
        let result = [];

        for (let line of lines) {
            // if after pattern is more content, add a newline after the pattern
            if (line.startsWith(pattern) && line.length > pattern.length) {
                result.push(pattern);
                result.push(line.slice(pattern.length));
            } else {
                result.push(line);
            }
        }

        const newContent = result.join('\n');
        return newContent;
    }

    async function createNewContentFromSource(sourceFilePath) {
        try {
            const sourceFileContent = readFileSync(sourceFilePath, 'utf8');

            // show only the file name
            const fileNameWithExt = sourceFilePath.split('/').pop();
            const fileNameWithoutExt = fileNameWithExt.split('.')[0];

            const lines = sourceFileContent.split('\n');
            let headingCount = 0;
            let outputMinusTerm = [];
            let outputTerm = [];
            let pushToTerm = true;

            outputMinusTerm.push(`## Term Definition\n\nSpec-Up-T link: <a href='https://weboftrust.github.io/WOT-terms/docs/glossary/${fileNameWithoutExt}'>here</a>\n`);
            for (let line of lines) {
                if (/^#+\s/.test(line)) {
                    headingCount++;
                    if (headingCount === 1) {
                        pushToTerm = true;
                        outputTerm.push(line);  // Add first heading
                    } else if (headingCount === 2) {
                        pushToTerm = false;
                        outputMinusTerm.push(line);  // Add second heading
                    }
                } else {
                    if (pushToTerm) {
                        outputTerm.push(line);  // Everything after first heading until second heading
                    } else {
                        outputMinusTerm.push(line);  // Everything after second heading
                    }
                }
            }

            const outputTermContent = outputTerm.join('\n');
            const outputMinusTermContent = outputMinusTerm.join('\n');

            // Compare the file name with the ToIP_Fkey values in the metadata
            // test if file is in allToIP_FkeyValues
            const fileInToIP_FkeyValues = allToIP_FkeyValues.includes(fileNameWithoutExt);


            /* IF ( ToIP_Fkey matches a .md file in the TermsDir with the exact same name ) THEN
                Write file under the exact same name to directory TermsDirResult 
            */
            if (fileInToIP_FkeyValues) {

                // 1 of 2: Write outputMinusTermContent to the original files minus the term
                const latestFilePath = path.join(outputMinusTermsDir, 'latest', fileNameWithExt);

                // Ensure the directory exists
                fs.mkdir(path.dirname(latestFilePath), { recursive: true }, (err) => {
                    if (err) throw err;

                    // Write the file
                    fs.writeFile(latestFilePath, outputMinusTermContent, { flag: 'w' }, (err) => {
                        if (err) throw err;
                        console.log('File created/updated successfully at:', latestFilePath);
                    });
                });

                // 2 of 2: Write outputTermContent to the terms directory
                let outputTermContentProcessed = outputTermContent;

                // The path to the file in the terms directory
                const termsDirPath = path.join(termsDir, path.basename(sourceFilePath));

                if (isAliasTrue(fileNameWithoutExt)) {
                    /*
                        In the file put [[def: term, alias]] (term=the filename without .md. The Alias is the one in the 'Term' field in the sheet)
                    */

                    // Conversion to Spec-Up-T: Add the [[def: term]] reference at the beginning of the file
                    outputTermContentProcessed = `[[def: ${fileNameWithoutExt}, ${findTermInObjMetadata(fileNameWithoutExt)}]]\n` + outputTermContentProcessed;
                } else {
                    /* 
                        else [[def: term, alias]] (alias is the name of the file without '-', replacing the '-' with a space)
                    */

                    let fileNameWithoutExtNoDash = fileNameWithoutExt.replace(/-/g, ' ');

                    // Conversion to Spec-Up-T: Add the [[def: term]] reference at the beginning of the file
                    outputTermContentProcessed = `[[def: ${fileNameWithoutExt}, ${fileNameWithoutExtNoDash}]]\n` + outputTermContentProcessed;
                }

                // Conversion to Spec-Up-T: Ensure a newline after the '## See ' pattern
                outputTermContentProcessed = ensureNewlineAfterPattern(outputTermContentProcessed)

                // // Conversion to Spec-Up-T: Remove everything after the second heading
                // sourceFileContent = removeEverythingAfterSecondHeading(sourceFileContent);

                // Conversion to Spec-Up-T: Replace internal markdown links with the Spec-Up-T reference format
                outputTermContentProcessed = replaceInternalMarkdownLinks(outputTermContentProcessed)

                // Conversion to Spec-Up-T: Remove markdown headings
                outputTermContentProcessed = removeMarkdownHeadings(outputTermContentProcessed);

                // Add a line at the end of the file with a link to the KERI glossary
                outputTermContentProcessed += `\nMore in <a href="https://weboftrust.github.io/WOT-terms/docs/glossary/${fileNameWithoutExt}">extended KERI glossary</a>`

                // Conversion to Spec-Up-T: Write the updated content to the new file
                await appendFileAsync(termsDirPath, outputTermContentProcessed);
            } else {
                console.log(`File not found in ToIP_Fkey: ${fileNameWithoutExt}`);
                numberOfMissingMatches++;
            }
        } catch (err) {
            console.error(`${sourceFilePath}`, err);
        }
    }

    (async () => {
        // Empty the terms directory
        await fs.emptyDir(termsDir);

        // Make a copy of the source files to a backup directory
        await makeCopyOfSourceFiles(sourceDirectoryPath, path.join(outputMinusTermsDir, 'archive', 'initialBackup'), false);

        // Make a copy of the source files to a temp directory that will be the source for the latest directory
        await makeCopyOfSourceFiles(sourceDirectoryPath, path.join(outputMinusTermsDir, 'temp'), false);

        // Make a copy of the source files to a new directory
        // await makeCopyOfSourceFiles(sourceDirectoryPath, path.join(outputMinusTermsDir, 'latest'), true);

        // await processFilesWithExtensionInDirectory(path.join(outputMinusTermsDir, 'latest'), fileExtension, createNewContentFromSource);
        await processFilesWithExtensionInDirectory(path.join(outputMinusTermsDir, 'temp'), fileExtension, createNewContentFromSource);

        // create a unix timestamp of the current date and time
        const timestamp = Math.floor(Date.now() / 1000);
        await makeCopyOfSourceFiles(path.join(outputMinusTermsDir, 'latest'), path.join(outputMinusTermsDir, 'archive', timestamp.toString()), false);

        // Remove temp dir
        fs.remove(path.join(outputMinusTermsDir, 'temp'), (err) => {
            if (err) throw err;
        });

        // Run Spec-Up-T render so that the new files are included in the output and we have an index.html file.
        if (typeof specUpT === 'function') {
            specUpT({ nowatch: true });
        } else {
            console.error('specUpT is not defined or is not a function.');
        }

        console.log(`**************\n\nHouston, we have ${numberOfMissingMatches} problems\n\n**************`);
    })();
}



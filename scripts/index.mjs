import { readFileSync, appendFile, existsSync } from 'fs';
import { promisify } from 'util';
import path, { join } from 'path';
import fs from 'fs-extra'; // Assuming you are using fs-extra for readJsonSync
import processFilesInDirectory from "./modules/processFilesInDirectory.mjs";
import makeCopyOfSourceFiles from "./modules/makeCopyOfSourceFiles.mjs";
import { showLinkToDocumentation } from './modules/showLinkToDocumentation.mjs';
import readline from 'readline';
import { config } from 'dotenv';
config();

let sourceDirectoryPath = '';

// This script should be run from the root of the project, let's check if we are in the right directory
const isRoot = existsSync(join(process.cwd(), 'package.json'));

if (!isRoot) {
    console.error('\nThis script should be run from the root of the project\nPlease go to the root of the project and try again.\n');
    process.exit(1);
}

showLinkToDocumentation();


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('\n\n\n********************\n\nPlease enter the path to the source directory files.\n\nThis can be a relative path (to this repo) or absolute\n(starting from the root of your file system)\n\nWARNING: This will remove your existing terms first.\n\n********************\n\nPLEASE ENTER PATH (no quotes around it):', (input) => {
    sourceDirectoryPath = input;
    // console.log(`Source Directory Path: ${sourceDirectoryPath}`);
    rl.close();
    main();
});


function main() { 
    
    /* CONFIG */
    const fileExtension = '.md';
    
    
    
    const config = fs.readJsonSync('./output/specs-generated.json');
    const termsdir = path.join(config.specs[0].spec_directory, config.specs[0].spec_terms_directory);
    const outputDir = process.env.WOTTERMSTOSPECUPT_OUTPUT_DIR;
    const metadataJsonLocation = `./${outputDir}/metadata.json`;
    
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

    function removeFirstHeadingUntilSecondHeadingAndWriteToNewSourceFile(filePath) {
        // delete the first part of the file up to the second heading and write it to a new source file
        try { 
            const fileContent = readFileSync(filePath, 'utf8');
            // // show only the file name
            const fileNameWithExt = filePath.split('/').pop();
            const fileNameWithoutExt = fileNameWithExt.split('.')[0];
            const lines = fileContent.split('\n');
            let headingCount = 0;
            let result = [];
            let skip = false;
            result.push(`## Term Definition\n\nSpec-Up-T link: <a href='https://weboftrust.github.io/WOT-terms/docs/glossary/${fileNameWithoutExt}'>here</a>\n`);
            for (let line of lines) {
                if (/^#+\s/.test(line)) {
                    headingCount++;
                    if (headingCount === 1) {
                        skip = true;
                    } else if (headingCount === 2) {
                        skip = false;
                    }
                }
                if (!skip) {
                    result.push(line);
                }
            }

            const newContent = result.join('\n');

            fs.writeFile(filePath, newContent, (err) => {
                if (err) throw err;
            });
            
        } catch (err
        ) {
            console.error(`${filePath}`, err);
        }
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
                    fileContent = `[[def: ${fileNameWithoutExt}, ${findTermInObjMetadata(fileNameWithoutExt)}]]\n` + fileContent;
                } else {
                    /* 
                        anders [[def: term, alias]] (alias is de naam van de file zonder '-', door de '-' te vervangen door een spatie)
                    */

                    let fileNameWithoutExtNoDash = fileNameWithoutExt.replace(/-/g, ' ');
                    
                    // Conversion to Spec-Up-T: Add the [[def: term]] reference at the beginning of the file
                    fileContent = `[[def: ${fileNameWithoutExt}, ${fileNameWithoutExtNoDash}]]\n` + fileContent;
                }

                // Conversion to Spec-Up-T: Ensure a newline after the '## See ' pattern
                fileContent = ensureNewlineAfterPattern(fileContent)

                // Conversion to Spec-Up-T: Remove everything after the second heading
                fileContent = removeEverythingAfterSecondHeading(fileContent);

                // Conversion to Spec-Up-T: Replace internal markdown links with the Spec-Up-T reference format
                fileContent = replaceInternalMarkdownLinks(fileContent)

                // Conversion to Spec-Up-T: Remove markdown headings
                fileContent = removeMarkdownHeadings(fileContent);

                // Add a line at the end of the file with a link to the KERI glossary
                fileContent += `\nMore in <a href="https://weboftrust.github.io/WOT-terms/docs/glossary/${fileNameWithoutExt}">extended KERI glossary</a>`

                // Conversion to Spec-Up-T: Write the updated content to the new file
                await appendFileAsync(newFilePath, fileContent);
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
        // // Empty the terms directory
        // await fs.emptyDir(termsdir);
        
        // // Make a copy of the source files to a backup directory
        // await makeCopyOfSourceFiles(sourceDirectoryPath, "./sourceFilesConverted/archive/initialBackup", false);
        
        // // Make a copy of the source files to a new directory
        // await makeCopyOfSourceFiles(sourceDirectoryPath, "./sourceFilesConverted/latest", true);
        
        // // remove First Heading Until Second Heading And Write To New Source File for each file in the sourceFilesConverted directory
        // await processFilesInDirectory("./sourceFilesConverted/latest", fileExtension, removeFirstHeadingUntilSecondHeadingAndWriteToNewSourceFile);

        // // Convert the files in the sourceFilesConverted directory
        // await processFilesInDirectory("./sourceFilesConverted/latest", fileExtension, convertFiles);

        // const outputDir = "sourceFilesConverted";
        // await processFilesInDirectory(`./${outputDir}/latest`, fileExtension, convertFiles);

        // // create a unix timestamp of the current date and time
        // const timestamp = Math.floor(Date.now() / 1000);
        // await makeCopyOfSourceFiles("./sourceFilesConverted/latest", `./sourceFilesConverted/archive/${timestamp}`, false);

        // 

        // Empty the terms directory
        await fs.emptyDir(termsdir);

        // Make a copy of the source files to a backup directory
        await makeCopyOfSourceFiles(sourceDirectoryPath, `./${outputDir}/archive/initialBackup`, false);

        // Make a copy of the source files to a new directory
        await makeCopyOfSourceFiles(sourceDirectoryPath, `./${outputDir}/latest`, true);

        // remove First Heading Until Second Heading And Write To New Source File for each file in the sourceFilesConverted directory
        await processFilesInDirectory(`./${outputDir}/latest`, fileExtension, removeFirstHeadingUntilSecondHeadingAndWriteToNewSourceFile);

        // Convert the files in the sourceFilesConverted directory
        await processFilesInDirectory(`./${outputDir}/latest`, fileExtension, convertFiles);

        // create a unix timestamp of the current date and time
        const timestamp = Math.floor(Date.now() / 1000);
        await makeCopyOfSourceFiles(`./${outputDir}/latest`, `./${outputDir}/archive/${timestamp}`, false);

        // 

        console.log(`**************\n\nHouston, we have ${numberOfMissingMatches} problems\n\n**************`);
    })();



}



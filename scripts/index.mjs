import { readFileSync, appendFile } from 'fs';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra'; // Assuming you are using fs-extra for readJsonSync
import processFilesInDirectory from "./modules/processFilesInDirectory.mjs";
import makeCopyOfWikiFiles from "./modules/makeCopyOfWikiFiles.mjs";
import readline from 'readline';

let sourceDirectoryPath = '';

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
    const googlesheet = readFileSync('./output/metadata.json', 'utf8');
    const config = fs.readJsonSync('./output/specs-generated.json');
    const termsdir = path.join(config.specs[0].spec_directory, config.specs[0].spec_terms_directory);
    /* END CONFIG */
    
    const appendFileAsync = promisify(appendFile);
    const googlesheetValues = JSON.parse(googlesheet).values;
    const indexOfToIP_Fkey = googlesheetValues[0].indexOf('ToIP_Fkey');
    const indexOfAlias = googlesheetValues[0].indexOf('Alias');
    const indexOfTerm = googlesheetValues[0].indexOf('Term');
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
    function findTerm(fName) {
        let term = '';

        // Iterate over each row in googlesheetValues, will not stop until the end of the array. forEach is not designed to be stoppable. It always iterates through all elements in the array.
        googlesheetValues.forEach((row, index) => {
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

    function removeFirstHeadingUntilSecondHeadingAndWriteToNewWikiFile(filePath) {
        // verwijder het eerste stuk van de file tot aan de tweede heading en schrijf het naar een nieuwe wiki file
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
            // console.log('filePath: ', filePath);
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
                    fileContent = `[[def: ${fileNameWithoutExt}, ${findTerm(fileNameWithoutExt)}]]\n` + fileContent;
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
        // Empty the terms directory
        await fs.emptyDir(termsdir);
        
        // Make a copy of the wiki files to a backup directory
        await makeCopyOfWikiFiles(sourceDirectoryPath, "./backupWikiFiles", false);
        
        // Make a copy of the wiki files to a new directory
        await makeCopyOfWikiFiles(sourceDirectoryPath, "./newWikiFiles", true);
        
        // remove First Heading Until Second Heading And Write To New Wiki File for each file in the newWikiFiles directory
        await processFilesInDirectory("./newWikiFiles", fileExtension, removeFirstHeadingUntilSecondHeadingAndWriteToNewWikiFile);

        // Convert the files in the newWikiFiles directory
        await processFilesInDirectory("./newWikiFiles", fileExtension, convertFiles);

        console.log(`**************\n\nHouston, we have ${numberOfMissingMatches} problems\n\n**************`);
    })();



}



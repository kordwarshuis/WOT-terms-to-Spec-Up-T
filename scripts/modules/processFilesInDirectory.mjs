import fs from 'fs';
import path from 'path';

/**
 * Loops through a directory and runs a function on all files with a certain extension.
 * @param {string} dir - The directory to loop through.
 * @param {string} ext - The file extension to look for.
 * @param {function} func - The function to run on each file.
 * @returns {Promise<void>}
 */
async function processFilesInDirectory(dir, ext, func) {
    try {
        const files = await fs.promises.readdir(dir);
        const promises = files.map(async (file) => {
            const filePath = path.join(dir, file);
            if (path.extname(file) === ext) {
                await func(filePath);
            }
        });
        await Promise.all(promises);
    } catch (err) {
        console.error(`Error processing files in directory: ${err}`);
        throw err;
    }
}

export default processFilesInDirectory;
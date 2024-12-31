import fs from 'fs';
import path from 'path';


// Create function that copies files from one directory to another
/**
 * Copies files from one directory to another.
 * @param {string} sourceDir - The source directory.
 * @param {string} targetDir - The target directory.
 * @returns {Promise<void>}
 */
async function copyFiles(sourceDir, targetDir, overwrite) {
    try {

        if (fs.existsSync(targetDir) && !overwrite) {
            console.log("Target directory already exists.");
            return
        }


        // Check if targetDir exists, if it exists, empty it
        if (fs.existsSync(targetDir)) {
            const files = await fs.promises.readdir(targetDir);
            const deletePromises = files.map(file => fs.promises.unlink(path.join(targetDir, file)));
            await Promise.all(deletePromises);
        } else {
            // If targetDir does not exist, create it
            await fs.promises.mkdir(targetDir, { recursive: true });
        }

        const files = await fs.promises.readdir(sourceDir);
        const promises = files
            .filter(file => !file.startsWith('.') && file !== 'Home.md')
            .map(async (file) => {
                const sourcePath = path.join(sourceDir, file);
                const targetPath = path.join(targetDir, file);
                await fs.promises.copyFile(sourcePath, targetPath);
            });
        await Promise.all(promises);
    } catch (err) {
        console.error(`Error copying files: ${err}`);
        throw err;
    }
}
export default copyFiles;
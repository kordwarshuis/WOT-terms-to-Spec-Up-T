import fs from 'fs-extra';
import path from 'path';

async function testIfOutputPathExists() {
    try {
        // Read and parse the specs.json file
        const config = fs.readJsonSync(path.resolve(process.cwd(), 'specs.json'));

        // Extract the output_path from the specs.json file
        const outputPath = config.specs[0].output_path;

        // Resolve the output path relative to the root directory (where package.json is)
        const resolvedOutputPath = path.resolve(process.cwd(), outputPath);

        // Check if the output path exists
        if (fs.existsSync(resolvedOutputPath)) {
            console.log(`Output path exists: ${resolvedOutputPath}`);
            return true;
        } else {
            console.log(`Output path does not exist: ${resolvedOutputPath}`);
            return false;
        }
    } catch (error) {
        console.error('Error reading specs.json or checking output path:', error);
        return false;
    }
}

export default testIfOutputPathExists;
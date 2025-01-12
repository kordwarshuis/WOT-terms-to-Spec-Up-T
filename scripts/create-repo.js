const readline = require('readline');
const https = require('https');
const { exec } = require('child_process');

// Explanation text
console.log(`
-----------------------------------------------
🔧 GitHub Repository Creator Script (Node.js)
-----------------------------------------------
This script helps you create a new GitHub repository directly from the command line.

👉 What you'll need:
1. Your GitHub username or organization name.
2. The name of the new repository.
3. Whether the repository is for a personal account or an organization.
4. Your GitHub Personal Access Token (PAT) or password.

Note: 
- If you use 2FA on your GitHub account, you'll need to enter a Personal Access Token (PAT).
- The input for your token/password will be hidden for security.
-----------------------------------------------
`);

// Function to ask for input securely (hides password/token)
const askHiddenInput = (question) => {
    return new Promise((resolve) => {
        process.stdout.write(question);
        process.stdin.setRawMode(true);
        let input = '';

        process.stdin.on('data', (char) => {
            char = char.toString();

            if (char === '\n' || char === '\r') {
                process.stdin.setRawMode(false);
                process.stdin.pause();
                process.stdout.write('\n');
                resolve(input);
            } else {
                input += char;
                process.stdout.write('*');
            }
        });

        process.stdin.resume();
    });
};


// Function to determine if the input is a PAT or a password
const isPAT = (input) => {
    return input.startsWith('ghp_') && input.length === 40;
};

// Function to execute Git commands with better error handling
const runGitCommand = (command, successMessage) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Error executing command: "${command}"`);
                console.error(`⚠️ ${stderr.trim()}`);
                console.log('💡 Tip: Make sure Git is installed and configured correctly.');
                reject(error);
            } else {
                console.log(`✅ ${successMessage}`);
                resolve(stdout);
            }
        });
    });
};

// Main function
(async () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter your GitHub username or organization: ', async (username) => {
        rl.question('Enter the name of the new repository: ', async (repoName) => {
            rl.question('Is this repo for an organization? (yes/no): ', async (isOrg) => {
                const tokenOrPassword = await askHiddenInput('Enter your GitHub Personal Access Token (or password): ');

                const authType = isPAT(tokenOrPassword) ? 'token' : 'password';

                // Choose the API endpoint
                const endpoint = isOrg === 'yes'
                    ? `/orgs/${username}/repos`
                    : '/user/repos';

                const options = {
                    hostname: 'api.github.com',
                    path: endpoint,
                    method: 'POST',
                    headers: {
                        'Authorization': `${authType} ${tokenOrPassword}`,
                        'User-Agent': 'Node.js Script',
                        'Content-Type': 'application/json',
                    },
                };

                const data = JSON.stringify({
                    name: repoName,
                    private: false,
                });

                const req = https.request(options, async (res) => {
                    res.on('data', (d) => {
                        process.stdout.write(d);
                    });

                    if (res.statusCode === 201) {
                        console.log('\n✅ Repository created successfully on GitHub!\n');

                        // Run Git commands with better error handling
                        try {
                            await runGitCommand('git init', 'Initialized a new Git repository locally.');
                            await runGitCommand(`git remote add origin https://github.com/${username}/${repoName}.git`, 'Set the remote URL.');
                            await runGitCommand('git branch -M main', 'Renamed the branch to "main".');
                            await runGitCommand('git push -u origin main', 'Pushed the initial commit to GitHub.');
                        } catch (error) {
                            console.error('❌ An error occurred while running Git commands.');
                        }
                    } else {
                        console.error('\n❌ Failed to create the repository on GitHub.');
                    }
                });

                req.on('error', (error) => {
                    console.error(`❌ HTTPS Request Error: ${error.message}`);
                    console.log('💡 Tip: Check your internet connection or GitHub API token.');
                });

                req.write(data);
                req.end();

                rl.close();
            });
        });
    });
})();

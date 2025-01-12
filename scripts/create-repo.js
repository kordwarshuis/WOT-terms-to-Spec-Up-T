const readline = require('readline');
const https = require('https');

// Function to ask for input securely (hides password/token)
const askHiddenInput = (question) => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question(question, (input) => {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write('\n'); // Move to the next line to hide input
            rl.close();
            resolve(input);
        });

        process.stdout.write(question);
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', (char) => {
            if (char.toString() === '\n' || char.toString() === '\r') {
                process.stdin.setRawMode(false);
                process.stdin.pause();
            }
        });
    });
};

// Function to determine if the input is a PAT or a password
const isPAT = (input) => {
    return input.startsWith('ghp_') && input.length === 40;
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

                const req = https.request(options, (res) => {
                    res.on('data', (d) => {
                        process.stdout.write(d);
                    });
                });

                req.on('error', (error) => {
                    console.error(error);
                });

                req.write(data);
                req.end();

                rl.close();
            });
        });
    });
})();

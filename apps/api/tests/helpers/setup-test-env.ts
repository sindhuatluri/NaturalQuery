import { exec } from 'child_process';

export async function setupTestEnvironment() {
  try {
    const command = 'docker-compose -f docker-compose.test.yml up -d';
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to setup test environment: ${error.message}`);
        throw error;
      }
      if (stderr) {
        console.error(`Error: ${stderr}`);
        return;
      }
      console.log('Starting test databases...');
      console.log('Test environment is ready:', stdout);
    });
  } catch (error) {
    console.error('Failed to execute command:', error);
    throw error;
  }
}

setupTestEnvironment();

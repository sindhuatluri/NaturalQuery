import { exec } from 'child_process';

export async function teardownTestEnvironment() {
  try {
    const command = 'docker-compose -f docker-compose.test.yml down -v';
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to tear down test environment: ${error.message}`);
        throw error;
      }
      if (stderr) {
        console.error(`Error: ${stderr}`);
        return;
      }
      console.log('Test environment cleaned up:', stdout);
    });
  } catch (error) {
    console.error('Failed to execute command:', error);
    throw error;
  }
}

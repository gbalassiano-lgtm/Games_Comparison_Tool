require('dotenv').config();

const { getStatus, listProjects, findProjectsByName } = require('../lib/asana');

async function main() {
  const status = await getStatus();
  console.log('Asana status:', status.message);

  if (!process.env.ASANA_ACCESS_TOKEN) {
    console.log('\nHow to get a token:');
    console.log('1. Open https://app.asana.com/0/my-apps');
    console.log('2. Create new token → Personal access token');
    console.log('3. Copy it into .env as ASANA_ACCESS_TOKEN=...');
    process.exit(1);
  }

  const projectName = process.env.ASANA_PROJECT_NAME || 'Daily Games Overview';
  console.log(`\nSearching all projects for "${projectName}"...\n`);

  const projects = await listProjects();
  const matches = findProjectsByName(projects, projectName);

  if (!matches.length) {
    console.log(`No project matched "${projectName}".`);
    console.log('Similar names:');
    findProjectsByName(projects, 'daily').forEach(project => {
      console.log(`- ${project.name} | GID: ${project.gid}`);
    });
    process.exit(1);
  }

  for (const project of matches) {
    console.log(`- ${project.name}`);
    console.log(`  GID: ${project.gid}`);
    console.log(`  Workspace: ${project.workspace}\n`);
  }

  if (matches.length === 1) {
    console.log('Add this to your .env:');
    console.log(`ASANA_PROJECT_GID=${matches[0].gid}`);
    console.log('\nOr open in browser:');
    console.log(`https://app.asana.com/0/${matches[0].gid}/list`);
  }
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});

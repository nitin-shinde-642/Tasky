const Store = require('electron-store');
const { v4: uuidv4 } = require('uuid');

const store = new Store();
const FOLDER_NAME = 'Inbox';
const STORAGE_KEY = `tasklyn_${FOLDER_NAME}_tasks`;

console.log('Generating 1000 tasks for performance testing...');

const tasks = [];
for (let i = 0; i < 1000; i++) {
  tasks.push({
    id: uuidv4(),
    title: `Performance Test Task #${i + 1}`,
    description: i % 2 === 0 ? `This is a randomly generated description for task ${i}. It has some extra text to simulate realistic workloads.` : '',
    completed: i % 5 === 0, // 20% completed
    createdAt: Date.now() - Math.floor(Math.random() * 10000000)
  });
}

store.set(STORAGE_KEY, tasks);
console.log(`Successfully injected 1000 tasks into ${STORAGE_KEY}.`);
console.log('Please refresh/restart the app and check the UI responsiveness.');

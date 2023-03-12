import fetch from 'node-fetch';

const spawn = require('child_process').spawn;

ping();

function ping() {
  fetch(`http://${process.env.ipfshost}:${process.env.ipfsport}/ping`)
    .then((res: any) => res.text())
    .then((text: any) => {
      console.log('Deploying:');
      spawn('node', ['src/index.ts'], { stdio: 'inherit' });
    })
    .catch((err: any) => {
      console.log('Waiting for IPFS...');
      setTimeout(ping, 2000);
    });
}

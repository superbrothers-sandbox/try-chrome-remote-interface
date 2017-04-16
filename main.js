"use strict";

const fs = require('fs');
const spawn = require('child_process').spawn;
const CDP = require('chrome-remote-interface');

const headless = spawn("google-chrome", ['--headless', '--remote-debugging-port=9222','--window-size=1280x1696']);

CDP((client) => {
    // extract domains
    const {Network, Page} = client;
    // setup handlers
    Network.requestWillBeSent((params) => {
        console.log(params.request.url);
    });
    Page.loadEventFired(() => {
        Page.captureScreenshot().then(v => {
            let filename = `screenshot-${Date.now()}`;
            fs.writeFileSync(filename + '.png', v.data, 'base64');
            console.log(`Image saved as ${filename}.png`);

            client.close();
            headless.kill('SIGQUIT');
        });
    });
    // enable events then start!
    Promise.all([
        Network.enable(),
        Page.enable()
    ]).then(() => {
        return Page.navigate({url: 'https://github.com/cyrus-and/chrome-remote-interface'});
    }).catch((err) => {
        console.error(err);
        client.close();
    });
}).on('error', (err) => {
    // cannot connect to the remote endpoint
    console.error(err);
});

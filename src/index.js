const setup = require('./starter-kit/setup');
const request = require('request');
const fs = require('fs');
const {WebClient} = require('@slack/client');
const web = new WebClient( process.env.SLACK_TOKEN );

exports.handler = async (event, context, callback) => {
  // For keeping the browser launch
  context.callbackWaitsForEmptyEventLoop = false;

  const body = JSON.parse(event.body);

  console.log('********The initial information from slack: ', event.body, '********');

  const browser = await setup.getBrowser();

  console.log('got browser');

  const channel = body.event.channel;

  const url = body.event.links[0].url;

  const page = await browser.newPage();

  await page.goto(url);

  console.log('********Redirected to login********');
  await page.evaluate( (username, password) => {
          const inputs = document.querySelectorAll('input');
          inputs[0].value = username;
          inputs[1].value = password;
          document.querySelector('form').submit();
   }, process.env.USERNAME, process.env.PASSWORD);

  console.log('********Creds Inserted and Accepted********');
  
  await page.waitForNavigation({
    waitUntil: 'networkidle',
    networkIdleTimeout: 500
  });

  console.log('********Preparing to Take Screenshot********');
  
  await page.screenshot(
    {
      path: '/tmp/temp.jpeg',
      type: 'jpeg',
      quality: 50,
    }
  );
  
  console.log('********Preparing to Upload Screenshot********');
    
  web.files.upload('ss_bot.jpeg', {
        file: fs.createReadStream(`/tmp/temp.jpeg`),
        channels: [ channel ],
        text: ' ',
  })
  .then( ( res ) => {
    console.log('********Screenshot Uploaded********');
    callback(null, { statusCode: 200 } );
  })
  .catch( ( err ) => {
        console.log(err);
  });
};

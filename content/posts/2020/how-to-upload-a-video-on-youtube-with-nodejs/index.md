+++
title = "How to upload a video on Youtube with NodeJS"
slug = 'how-to-upload-a-video-on-youtube-with-nodejs'
aliases = ['/post/how-to-upload-a-video-on-youtube-with-nodejs']
date = '2020-03-16T13:57:09.000Z'
draft = false
tags = ["api","nodejs","youtube"]
image = 'featured.jpg'
+++

I recently worked on a simple project for a Twitter user that wanted a way to reshare videos over Youtube. The Google documentation was not really clear so here is a post to better explain how to upload a video with the Youtube API in NodeJS.

## Preparation

First of all, you need to create an new app to authenticate on the Google API, here are the steps provided by the developer documentation:

1.  Use [this wizard](https://console.developers.google.com/start/api?id=youtube) to create or select a project in the Google Developers Console and automatically turn on the API. Click **Continue**, then **Go to credentials**.
    
2.  On the **Add credentials to your project** page, click the **Cancel** button.
    
3.  At the top of the page, select the **OAuth consent screen** tab. Select an **Email address**, enter a **Product name** if not already set, and click the **Save** button.
    
4.  Select the **Credentials** tab, click the **Create credentials** button and select **OAuth client ID**.
    
5.  Select the application type **Other**, enter the name "YouTube Data API Quickstart", and click the **Create** button.
    
6.  Click **OK** to dismiss the resulting dialog.
    
7.  Click the file\_download (Download JSON) button to the right of the client ID.
    
8.  Move the downloaded file to your working directory and rename _client\_secret.json_.
    

After creating a npm project in your working repository, install the following dependencies:

```bash
npm install googleapis --save
npm install google-auth-library --save
```

## Authorize your script on the Youtube API

Following this steps, here is a helper file to authorize your account on your app.  
The authentication process will ask the current user to follow a link and give to your app access your Google account youtube details and upload permissions. Then the API authentication will return an access token that we are going to store in _~/.credentials/upload\_app\_session.json_. This file will be read everytime we need to reauthenticate our upload script, until the access token expire.

```javascript
const fs = require('fs');
const { google } = require('googleapis');
const readline = require('readline');
const OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/upload_app_session.json
const SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly'
];
const TOKEN_DIR =
    (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) +
    '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'upload_app_session.json';

const authorize = (credentials, cb) => {
    const clientSecret = credentials.installed.client_secret;
    const clientId = credentials.installed.client_id;
    const redirectUrl = credentials.installed.redirect_uris[0];
    const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (error, token) => {
        if (error) {
            return getNewToken(oauth2Client, cb);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            return cb(null, oauth2Client);
        }
    });
};

const getNewToken = (oauth2Client, cb) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', code => {
        rl.close();
        oauth2Client.getToken(code, (error, token) => {
            if (error) {
                return cb(
                    new Error(
                        'Error while trying to retrieve access token',
                        error
                    )
                );
            }
            oauth2Client.credentials = token;
            storeToken(token);
            return cb(null, oauth2Client);
        });
    });
};

const storeToken = token => {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (error) {
        if (error.code != 'EEXIST') {
            throw error;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), error => {
        if (error) throw error;
        console.log('Token stored to ' + TOKEN_PATH);
    });
};

module.exports = { authorize };
```

In your main js file you just have to call the authorize function and pass the content of the file:

```javascript
fs.readFile('client_secret.json', (error, content) => {
    if (error) {
        console.log('Error loading client secret file: ' + error);
        return cb(error);
    }
    // Authorize a client with the loaded credentials
    authorize(JSON.parse(content), cb);
});
```

## Upload your video and details

The final usage of the upload function is pretty simple. You need to pass the authicated user to the function and fill in a JSON to set the details of your video.  
More info concerning possible parameters on the videos.insert endpoint are available [here](https://developers.google.com/youtube/v3/docs/videos/insert).

```javascript
const { google } = require('googleapis');
const service = google.youtube('v3');
const fs = require('fs');

const uploadVideo = (auth, cb) => {
    service.videos.insert(
        {
            auth: auth,
            part: 'snippet,contentDetails,status',
            resource: {
                // Video title and description
                snippet: {
                    title: 'My title',
                    description: 'My description'
                },
                // I set to private for tests
                status: {
                    privacyStatus: 'private'
                }
            },

            // Create the readable stream to upload the video
            media: {
                body: fs.createReadStream('video.flv') // Change here to your real video
            }
        },
        (error, data) => {
            if (error) {
                return cb(error);
            }
            console.log('https://www.youtube.com/watch?v=' + data.data.id);
            return cb(null, data.data.id);
        }
    );
};


module.exports = { uploadVideo };
```

Here you are you then need to call uploadVideo method from your main file after the authentication.

I hope this tutorial is clearer than the documentation provided by Youtube, if you have any question feel free to post them in the comments below!

## Want to skip the OAuth headache?

If you are uploading to multiple platforms, <a href="https://getlate.dev" target="_blank" rel="noopener">Late's API</a> handles authentication and uploads for YouTube, TikTok, Instagram, and 9 other platforms. Here is what the same upload looks like:

```js
await late.posts.create({
 profileIds: ["youtube-profile-id"],
 text: "My description",
 mediaUrls: ["https://example.com/video.mp4"],
 platforms: { youtube: { title: "My title" } }
});
```

No OAuth setup, no token management, no 100 lines of boilerplate.

===

Background photo for the featured image by [NOAA](https://unsplash.com/@noaa?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText).

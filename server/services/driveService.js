const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = path.join(__dirname, '..', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');

let oAuth2Client = null;
let drive = null;

const initAuth = () => {
  let credentials;
  if (process.env.GOOGLE_CREDENTIALS) {
    try {
      credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    } catch (e) {
      throw new Error('Invalid JSON in GOOGLE_CREDENTIALS env var.');
    }
  } else if (fs.existsSync(CREDENTIALS_PATH)) {
    const content = fs.readFileSync(CREDENTIALS_PATH);
    credentials = JSON.parse(content);
  } else {
    throw new Error('Credentials not found. Please provide GOOGLE_CREDENTIALS env var or credentials.json.');
  }

  // Support both Web application and Desktop application client types
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  
  // Use our specific callback URI for this app, or allow override via ENV
  const redirectUri = process.env.REDIRECT_URI || 'http://localhost:5000/api/auth/callback';
  
  oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirectUri);

  let token;
  if (process.env.GOOGLE_TOKEN) {
    try {
      token = JSON.parse(process.env.GOOGLE_TOKEN);
    } catch (e) {
      console.error('Invalid JSON in GOOGLE_TOKEN env var');
    }
  } else if (fs.existsSync(TOKEN_PATH)) {
    token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  }

  if (token) {
    oAuth2Client.setCredentials(token);
    drive = google.drive({ version: 'v3', auth: oAuth2Client });
    return true; // Authenticated
  }
  return false; // Needs authentication
};

const getAuthUrl = () => {
  if (!oAuth2Client) initAuth();
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
};

const setCode = async (code) => {
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  
  try {
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  } catch (err) {
    console.warn('Could not write token.json to disk (expected in serverless environments):', err.message);
    console.log('You can use this token for your GOOGLE_TOKEN environment variable in production:', JSON.stringify(tokens));
  }
  
  drive = google.drive({ version: 'v3', auth: oAuth2Client });
};

const FOLDER_NAME = 'Bill Scanner';
let cachedFolderId = null;

const getFolderId = async () => {
  if (!drive) throw new Error('Google Drive not authenticated');
  if (cachedFolderId) return cachedFolderId;
  
  try {
    const res = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });
    if (res.data.files.length > 0) {
      cachedFolderId = res.data.files[0].id;
      return cachedFolderId;
    } else {
      const folderMetadata = {
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      };
      const folderRes = await drive.files.create({
        resource: folderMetadata,
        fields: 'id',
      });
      cachedFolderId = folderRes.data.id;
      return cachedFolderId;
    }
  } catch (error) {
    console.error('Error finding/creating folder:', error);
    throw error;
  }
};

const uploadFile = async (file, metadata) => {
  if (!drive) throw new Error('Google Drive not authenticated');
  const folderId = await getFolderId();
  
  const fileMetadata = {
    name: file.originalname,
    parents: [folderId],
    appProperties: {
      personName: metadata.personName,
      totalAmount: metadata.totalAmount,
      billDate: metadata.billDate,
    },
  };

  const media = {
    mimeType: file.mimetype,
    body: fs.createReadStream(file.path),
  };

  try {
    const res = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, appProperties, webViewLink, webContentLink',
    });
    return res.data;
  } catch (error) {
    console.error('Error uploading to Drive:', error);
    throw error;
  }
};

const getFiles = async (query = '') => {
  if (!drive) throw new Error('Google Drive not authenticated');
  try {
    const folderId = await getFolderId();
    let finalQuery = `'${folderId}' in parents and trashed=false`;
    
    if (query) {
      finalQuery += ` and ${query}`;
    }

    const res = await drive.files.list({
      q: finalQuery,
      fields: 'files(id, name, appProperties, webViewLink, webContentLink, createdTime)',
    });
    return res.data.files;
  } catch (error) {
    console.error('Error fetching files from Drive:', error);
    throw error;
  }
};

const updateFile = async (fileId, metadata, file = null) => {
  if (!drive) throw new Error('Google Drive not authenticated');
  try {
    const params = {
      fileId: fileId,
      resource: {
        appProperties: metadata,
      },
      fields: 'id, name, appProperties, webViewLink, webContentLink',
    };

    if (file) {
      params.resource.name = file.originalname;
      params.media = {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path),
      };
    }

    const res = await drive.files.update(params);
    return res.data;
  } catch (error) {
    console.error('Error updating file in Drive:', error);
    throw error;
  }
};

const deleteFile = async (fileId) => {
  if (!drive) throw new Error('Google Drive not authenticated');
  try {
    await drive.files.delete({
      fileId: fileId,
    });
    return true;
  } catch (error) {
    console.error('Error deleting file from Drive:', error);
    throw error;
  }
};

module.exports = {
  initAuth,
  getAuthUrl,
  setCode,
  uploadFile,
  getFiles,
  updateFile,
  deleteFile,
};

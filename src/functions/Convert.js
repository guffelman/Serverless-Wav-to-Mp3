const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const { Readable } = require('stream');
const path = require('path');

module.exports = async function (context, req) {
  context.log('Wav to Mp3 Converter HTTP trigger function processed a request.');

  if (req.method === 'GET') {
    context.res = {
      body: 'Wav to Mp3 Converter',
    };
  } else if (req.method === 'POST') {
    const file = req.body;

    if (!file) {
      context.res = {
        status: 400,
        body: 'No file uploaded',
      };
      return;
    }

    // Check if the file content is a Buffer
    if (!Buffer.isBuffer(file)) {
      context.res = {
        status: 400,
        body: 'Invalid file format',
      };
      return;
    }

    const mp3Filename = `${uuidv4()}.mp3`;

    context.res = {
      headers: {
        'Content-Disposition': `attachment; filename=${mp3Filename}`,
      },
      body: await new Promise((resolve, reject) => {
        const readStream = new Readable();
        readStream._read = () => {};
        readStream.push(file);
        readStream.push(null);

        ffmpeg(readStream)
          .audioCodec('libmp3lame')
          .toFormat('mp3')
          .pipe(context.res, { end: true })  // Use context.res instead of res
          .on('error', (err) => {
            context.log.error(err);
            console.error(err); // Log the error to the console
            reject({
              status: 500,
              body: 'Internal Server Error',
            });
          })
          .on('end', resolve);
      }),
    };
  } else {
    context.res = {
      status: 405,
      body: 'Method Not Allowed',
    };
  }
};

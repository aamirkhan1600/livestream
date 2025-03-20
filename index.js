require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
//const PORT = 3000;

// Set up storage for uploaded videos
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Upload video endpoint
app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.json({ message: 'File uploaded successfully', filename: req.file.filename });
});

// Stream to YouTube Live
app.get('/stream/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, 'uploads', filename);

    if (!fs.existsSync(filepath)) {
        return res.status(404).send('File not found.');
    }

    const streamKey = process.env.YOUTUBE_STREAM_KEY;
    const youtubeUrl = `rtmp://a.rtmp.youtube.com/live2/${streamKey}`;

    const ffmpeg = spawn('ffmpeg', [
        '-stream_loop', '-1', // Loop indefinitely
        '-re', '-i', filepath,   // Input video file
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency',
        '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
        '-f', 'flv', youtubeUrl  // Output to YouTube Live
    ]);

    ffmpeg.stdout.on('data', (data) => console.log(`stdout: ${data}`));
    ffmpeg.stderr.on('data', (data) => console.log(`stderr: ${data}`));
    ffmpeg.on('close', (code) => console.log(`FFmpeg exited with code ${code}`));

    res.json({ message: 'Streaming started', filename });
});

const PORT = process.env.PORT || 3000; // Use Railway's dynamic port or fallback to 3000
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});



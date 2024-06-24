require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const Replicate = require('replicate');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

app.use(cors()); // Enable CORS for all routes

app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        console.log('File received:', req.file.originalname);

        // Upload image to file.io
        const formData = new FormData();
        formData.append('file', req.file.buffer, req.file.originalname);

        const fileioResponse = await axios.post('https://file.io', formData, {
            headers: formData.getHeaders()
        });

        if (fileioResponse.status !== 200 || !fileioResponse.data.success) {
            console.error('File.io upload failed:', fileioResponse.data);
            return res.status(500).send('Failed to upload file to file.io');
        }

        const imagePath = fileioResponse.data.link;
        console.log('File uploaded to file.io:', imagePath);

        const input = {
            image_path: imagePath,
            export_texmap: true
        };

        console.log('Calling Replicate with input:', input);
        const output = await replicate.run("camenduru/instantmesh:4f151757fd04d508b84f2192a17f58d11673971f05d9cb1fd8bd8149c6fc7cbb", { input });

        const filteredOutput = [output[0], output[1], output[4]];
        console.log('Replicate output:', filteredOutput);
        res.json(filteredOutput);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        res.status(500).send('An error occurred.');
    }
});

app.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});

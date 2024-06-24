# Model Deployment

```
[https://replicate.com/demoiverrakada/bert-base-uncased](https://replicate.com/camenduru/instantmesh)
```
## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

Setup Node on your local machine

## Running on Local Machine

### Setup client for backend

```
mkdir client
cd client
npm init
npm install dotenv express multer cors axios replicate
```

#### Create server.js file

```
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
```

#### Create .env fileto use replicate token

```
REPLICATE_API_TOKEN=<your-replicate-api-token>
```
Replcae <your-replicate-api-token> with your actual api token

### Run the server

```npm start
```

### Setup frontend for user-interaction through webpage

```
npx create-react-add frontent
```

#### Replace the App.js file with below code

```
import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // Import the CSS file

function App() {
  const [file, setFile] = useState(null);
  const [resultUrls, setResultUrls] = useState([]);
  const [error, setError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(null);
  const [eventSource, setEventSource] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select an image file.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      // Send image file to backend for processing
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Assuming backend returns an array of URLs in response.data
      setResultUrls(response.data);
      setError(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('An error occurred while uploading the image.');
      setResultUrls([]);
    }
  };

  const handleCloseEventSource = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
  };

  return (
    <div className="App">
      <h1>Instantmesh Model (Replicate)</h1>
      <form onSubmit={handleSubmit} className="upload-form">
        <input type="file" onChange={handleFileChange} accept="image/*" className="file-input" />
        <button type="submit" className="upload-button">Upload</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {imagePreview && (
        <div className="image-preview-container">
          <h2>Selected Image Preview:</h2>
          <img src={imagePreview} alt="Selected" className="image-preview" />
        </div>
      )}
      {resultUrls.length > 0 && (
        <div className="results-container">
          <h2>Results:</h2>
          {resultUrls.map((url, index) => (
            <div key={index} className="result-item">
              {url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') ? (
                <img src={url} alt={`Processed Image ${index}`} className="result-image" />
              ) : (
                <video controls className="result-video">
                  <source src={url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
              <br />
              <a href={url} target="_blank" rel="noopener noreferrer" className="download-link">Download Result {index + 1}</a>
            </div>
          ))}
          <button onClick={handleCloseEventSource} className="close-button">Close Event Source</button>
        </div>
      )}
    </div>
  );
}

export default App;
```

#### Replace the App.css file with below code

```
/* App.css */

/* Reset default styles and set global styles */
body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

/* Styles for the main container */
.App {
  text-align: center;
  padding: 20px;
}

/* Header style */
h1 {
  color: #4CAF50;
  margin-bottom: 20px;
  font-size: 2.5rem;
}

/* Form container style */
.upload-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

/* File input style */
.file-input {
  margin-bottom: 10px;
  font-size: 1.2rem;
  padding: 10px;
  border: 2px solid #ccc;
  border-radius: 5px;
}

/* Upload button style */
.upload-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 12px 24px;
  cursor: pointer;
  font-size: 1.2rem;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.upload-button:hover {
  background-color: #45a049;
}

/* Error message style */
.error-message {
  color: red;
  margin-top: 10px;
  font-size: 1rem;
}

/* Image preview container style */
.image-preview-container {
  margin-top: 20px;
}

/* Image preview style */
.image-preview {
  max-width: 100%;
  height: auto;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
  background-color: #fff;
}

/* Results container style */
.results-container {
  margin-top: 20px;
}

/* Individual result item style */
.result-item {
  margin-bottom: 20px;
}

/* Result image and video style */
.result-image,
.result-video {
  max-width: 100%;
  height: auto;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
  background-color: #fff;
}

/* Download link style */
.download-link {
  display: inline-block;
  margin-top: 10px;
  text-decoration: none;
  color: #4CAF50;
  font-weight: bold;
  font-size: 1.1rem;
}

/* Close button style */
.close-button {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 12px 24px;
  cursor: pointer;
  font-size: 1.2rem;
  border-radius: 5px;
  transition: background-color 0.3s ease;
  margin-top: 20px;
}

.close-button:hover {
  background-color: #e53935;
}
```

### Run it

```
npm start
```

### Testing
Through webpage upload a png image, and you will get the result in about a minute




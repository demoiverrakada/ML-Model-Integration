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

const multer = require('multer');
const upload = multer();
const Vote = require('../models/vote');
const Nominee = require('../models/nominee');

// 1. this function return all articles
const getAllNominees = async (req, res) => {
  try {
    const nominees = await Nominee.findAll();
    res.json({
      success: true,
      data: nominees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create middleware for handling form data
const uploadMiddleware = upload.none(); // Use .none() since we're only handling text fields

const postVotes = async (req, res) => {
  const axios = require('axios');
  const qs = require('querystring');

  try {
    console.log('Form data received:', req.body);
    
    const { nomineeName ,voterNationalNumber ,image_base64_1, image_base64_2 } = req.body;

    // Validate the base64 strings
    if (!image_base64_1 || !image_base64_2) {
      return res.status(400).json({
        success: false,
        error: 'Both image_base64_1 and image_base64_2 are required',
        receivedData: req.body
      });
    }

    const data = {
      api_key: process.env.FACEPP_API_KEY,
      api_secret: process.env.FACEPP_API_SECRET,
      image_base64_1,
      image_base64_2
    };

    console.log('Preparing to send to Face++ API...');
    console.log('Data keys:', Object.keys(data));
    console.log('Image 1 length:', image_base64_1.length);
    console.log('Image 2 length:', image_base64_2.length);

    const response = await axios({
      method: 'post',
      url: 'https://api-us.faceplusplus.com/facepp/v3/compare',
      data: qs.stringify(data),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const confidence = response.data.confidence;
    console.log('Confidence score:', confidence);

    if (confidence > 80) {
      // Save the vote to the database
      const vote = await Vote.create({
        nomineeName,
        voterNationalNumber,
        image_base64_1, 
        image_base64_2,
        confidence
      });

      res.json({
        success: true,
        message: 'Vote saved successfully',
        vote
      });
    } else {
      res.json({
        success: false,
        message: 'Face comparison failed',
        confidence
      });
    }
    

  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to compare faces',
      details: error.message
    });
  }
};

module.exports = {
  getAllNominees,
  postVotes,
  uploadMiddleware
};

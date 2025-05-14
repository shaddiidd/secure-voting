'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Tesseract from 'tesseract.js';

const steps = {
  PHONE: 'phone',
  OTP: 'otp',
  ID_PHOTO: 'id_photo',
  FACE_PHOTO: 'face_photo',
  SUCCESS: 'success'
};

export default function VotePage({ params }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(steps.PHONE);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [idPhoto, setIdPhoto] = useState(null);
  const [facePhoto, setFacePhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [candidateId] = useState(params.id);
  const [voteStatus, setVoteStatus] = useState(null); // 'success' or 'error'
  const [voteMessage, setVoteMessage] = useState('');
  const [nationalId, setNationalId] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Function to convert image URL to base64
  const getBase64FromUrl = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const arabicToEnglishDigits = (str) => {
    // Arabic-Indic digits: ٠١٢٣٤٥٦٧٨٩
    const map = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
    return str.replace(/[٠-٩]/g, d => map[d]);
  };

  const extractNationalId = async (base64Image) => {
    const { data: { text } } = await Tesseract.recognize(
      `data:image/jpeg;base64,${base64Image}`,
      ['eng', 'ara']
    );
    console.log('OCR result:', text);

    // Convert Arabic-Indic digits to English
    let cleaned = arabicToEnglishDigits(text);

    // Remove all non-digit characters
    cleaned = cleaned.replace(/[^0-9]/g, ' ');

    // Log for debugging
    console.log('Cleaned OCR text:', cleaned);

    // Find the first 10+ digit sequence
    const match = cleaned.match(/\d{10,}/);
    return match ? match[0] : null;
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame on the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to base64 directly
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      if (currentStep === steps.ID_PHOTO) {
        console.log('Capturing ID photo');
        setIdPhoto(base64Image);
        stopCamera();
        setCurrentStep(steps.FACE_PHOTO);
        // Start front camera after a short delay
        setTimeout(startCamera, 500);

        // Extract national ID asynchronously
        extractNationalId(base64Image).then(id => {
          if (id) {
            setNationalId(id);
            console.log('Extracted national ID:', id);
          }
        });
      } else if (currentStep === steps.FACE_PHOTO) {
        console.log('Capturing face photo');
        setFacePhoto(base64Image);
        stopCamera();
        setCurrentStep(steps.SUCCESS);
      }
    }
  };

  // Function to submit vote
  const submitVote = async () => {
    setIsLoading(true);
    try {
      // Simulated data - in real app, these would come from actual user input
      const nomineeName = "John Doe";
      const voterNationalNumber = nationalId || "fallback_value";

      console.log('Submitting vote with images:', {
        idPhotoLength: idPhoto?.length,
        facePhotoLength: facePhoto?.length,
        currentStep
      });

      if (!idPhoto || !facePhoto) {
        console.error('Missing photos:', { idPhoto: !!idPhoto, facePhoto: !!facePhoto });
        throw new Error('Both photos are required');
      }

      const response = await fetch('http://localhost:3000/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nomineeName,
          voterNationalNumber,
          image_base64_1: idPhoto,
          image_base64_2: facePhoto
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setVoteStatus('success');
        setVoteMessage('Your vote has been recorded successfully!');
        toast.success('Vote submitted successfully!');
      } else {
        setVoteStatus('error');
        setVoteMessage(data.message || 'Failed to submit vote. Please try again.');
        toast.error(data.message || 'Failed to submit vote');
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      setVoteStatus('error');
      setVoteMessage(error.message || 'Failed to submit vote. Please try again.');
      toast.error(error.message || 'Failed to submit vote. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle camera initialization
  useEffect(() => {
    if (currentStep === steps.ID_PHOTO || currentStep === steps.FACE_PHOTO) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [currentStep]);

  // Handle vote submission when both photos are ready
  useEffect(() => {
    if (currentStep === steps.SUCCESS && idPhoto && facePhoto) {
      submitVote();
    }
  }, [currentStep, idPhoto, facePhoto]);

  const startCamera = async () => {
    try {
      // Stop any existing camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: currentStep === steps.ID_PHOTO ? 'environment' : 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      console.log('Starting camera with constraints:', constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      toast.error('Error accessing camera. Please ensure you have granted camera permissions.');
      console.error('Error accessing camera:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // TODO: Implement API call to send OTP
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      toast.success('OTP sent to your phone number');
      setCurrentStep(steps.OTP);
    } catch (error) {
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // TODO: Implement API call to verify OTP
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      toast.success('OTP verified successfully');
      setCurrentStep(steps.ID_PHOTO);
    } catch (error) {
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case steps.PHONE:
        return (
          <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Enter Your Phone Number</h2>
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {isLoading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          </div>
        );

      case steps.OTP:
        return (
          <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Enter OTP</h2>
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  One-Time Password
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          </div>
        );

      case steps.ID_PHOTO:
        return (
          <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Take ID Card Photo</h2>
            <p className="mb-6 text-gray-600 text-center">
              Please take a clear photo of your ID card. Make sure all details are visible.
            </p>
            <div className="relative aspect-video mb-6 bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={capturePhoto}
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Capture Photo
            </button>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        );

      case steps.FACE_PHOTO:
        return (
          <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Take Face Photo</h2>
            <p className="mb-6 text-gray-600 text-center">
              Please take a clear photo of your face. Make sure your face is well-lit and centered.
            </p>
            <div className="relative aspect-video mb-6 bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={capturePhoto}
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Capture Photo
            </button>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        );

      case steps.SUCCESS:
        return (
          <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg text-center">
            {!voteStatus ? (
              <>
                <div className="mb-6">
                  <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-600 mx-auto"></div>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Processing Your Vote</h2>
                <p className="mb-8 text-gray-600">Please wait while we process your vote...</p>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className={`w-20 h-20 ${voteStatus === 'success' ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto`}>
                    {voteStatus === 'success' ? (
                      <svg
                        className="w-12 h-12 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-12 h-12 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  {voteStatus === 'success' ? 'Vote Cast Successfully!' : 'Vote Submission Failed'}
                </h2>
                <p className="mb-8 text-gray-600">
                  {voteMessage}
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Return to Home
                </button>
              </>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {renderStep()}
      </div>
    </div>
  );
} 
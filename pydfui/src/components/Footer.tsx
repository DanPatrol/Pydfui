import React, { useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { FaLinkedin, FaEnvelope, FaGithub } from 'react-icons/fa';
import { TbBrandFiverr } from "react-icons/tb";
import { FaSquareUpwork } from 'react-icons/fa6';

const Footer = () => {
  const [suggestion, setSuggestion] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);  // State to manage the loading state

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!suggestion.trim()) {
      setMessage('Please enter a suggestion.');
      return;
    }


    setLoading(true);  // Set loading to true when the form is submitted

    try {
      const response = await fetch('https://pydf-api.vercel.app/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: suggestion,
        }),
      });

      const data = await response.json();

      if (response.ok && data.message === 'Email sent successfully!') {
        setMessage('Thank you for your suggestion!');
        setSuggestion(''); // Clear input field
      } else {
        setMessage('Failed to send your suggestion. Please try again later.');
      }
    } catch (error) {
      console.error('Error sending suggestion:', error);
      setMessage('Failed to send your suggestion. Please try again later.');
    } finally {
      setLoading(false);  // Set loading to false once the request is complete
    }
  };

  return (
    <div className="bg-white border-t border-gray-300 py-8 mt-8"> {/* Added mt-8 for top margin */}
      <Container>
        <Row>
          {/* Website Information Section */}
          <Col xs={12} md={6} lg={4} className="mb-4">
            <h5 className="text-gray-700 font-semibold mb-3">About Us</h5>
            <p className="text-gray-600 text-base leading-relaxed">
              Welcome to our PDF management platform! Here, you can easily manage, convert, and optimize your PDF files with just a few clicks.
            </p>
          </Col>

          {/* Contact Us Section with Icons */}
          <Col xs={12} md={4} lg={3} className="mb-4">
            <h5 className="text-gray-700 font-semibold mb-3">Contact Us</h5>
            <div className="d-flex flex-wrap justify-content-center">
              {/* LinkedIn, Upwork, Fiverr, and GitHub Icons */}
              <div className="m-2">
                <a href="https://www.linkedin.com/in/dan-gatobu-012544214/" target="_blank" rel="noreferrer">
                  <FaLinkedin size={28} />
                </a>
              </div>
              <div className="m-2">
                <a href="https://www.upwork.com/freelancers/~01128993ebc1bd665b?referrer_url_path=%2Fnx%2Fsearch%2Ftalent%2Fdetails%2F~01128993ebc1bd665b%2Fprofile" target="_blank" rel="noreferrer">
                  <FaSquareUpwork size={28} />
                </a>
              </div>
              <div className="m-2">
                <a href="https://www.fiverr.com/dan_new_ton" target="_blank" rel="noreferrer">
                  <TbBrandFiverr size={28} />
                </a>
              </div>
              <div className="m-2">
                <a href="https://github.com/DanGatobu" target="_blank" rel="noreferrer">
                  <FaGithub size={28} />
                </a>
              </div>

              {/* Email Icon and Text */}
              <div className="m-2 mt-4">
                <a href="mailto:rdan99848@gmail.com" className="text-center text-gray-700">
                  <FaEnvelope size={28} />
                  <div className="mt-2 text-sm">rdan99848@gmail.com</div>
                </a>
              </div>
            </div>
          </Col>

          {/* Suggestion Box Section */}
          <Col xs={12} lg={5} className="mb-4">
            <h5 className="text-gray-700 font-semibold mb-3">Suggest New Features</h5>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Your suggestion"
                  className="rounded-md"
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                />
              </Form.Group>
              <Button 
                variant="primary" 
                type="submit" 
                className="w-full" 
                disabled={loading}  // Disable button when loading
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Loading...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </Form>
            {message && <p className="mt-3 text-center text-sm">{message}</p>}
          </Col>
        </Row>

        <Row className="text-center mt-4">
          <Col>
            <hr />
            <p className="py-2 text-sm">&copy; 2024 All Rights Reserved</p>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Footer;

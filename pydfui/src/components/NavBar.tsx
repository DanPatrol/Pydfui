import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook from react-router-dom
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import Dropdown from 'react-bootstrap/Dropdown';

const NavBar = () => {
  const [selectedAction, setSelectedAction] = useState('merge'); // Default to 'merge'
  const navigate = useNavigate(); // Initialize useNavigate hook

  // Function to handle navigation based on selected action
  const handleSelection = (action: 'merge' | 'split' | 'compress' | 'home') => {
    setSelectedAction(action); // Update the selected action state
    if (action === 'merge') {
      navigate('/upload/merge'); // Navigate to /upload/merge route
    } else if (action === 'split') {
      navigate('/upload/split'); // Navigate to /upload/split route
    } else if (action === 'compress') {
      navigate('/upload/compress'); // Navigate to /upload/compress route
    } else if (action === 'home') {
      navigate('/'); // Navigate to the home route
    }
  };

  return (
    <nav className="mb-20 flex items-center justify-between py-6 bg-white">
      <div className="flex flex-shrink-0 justify-center gap-4">
        {/* Navigation Items */}
        <text
          className={`text-sm ${selectedAction === 'home' ? 'text-red-500' : 'text-black'} hover:text-red-500 cursor-pointer`}
          onClick={() => handleSelection('home')}
        >
          Home
        </text>
        <text
          className={`text-sm ${selectedAction === 'merge' ? 'text-red-500' : 'text-black'} hover:text-red-500 cursor-pointer`}
          onClick={() => handleSelection('merge')}
        >
          Merge Pdf
        </text>
        <text
          className={`text-sm ${selectedAction === 'split' ? 'text-red-500' : 'text-black'} hover:text-red-500 cursor-pointer`}
          onClick={() => handleSelection('split')}
        >
          Split Pdf
        </text>
        <text
          className={`text-sm ${selectedAction === 'compress' ? 'text-red-500' : 'text-black'} hover:text-red-500 cursor-pointer`}
          onClick={() => handleSelection('compress')}
        >
          Compress Pdf
        </text>

        {/* Dropdowns */}
        <Dropdown drop="down" className="text-sm">
          <Dropdown.Toggle
            variant="link"
            className="text-black hover:text-red-500 cursor-pointer p-0 border-0 no-underline" // Removed underline here
            id="dropdown-basic"
          >
            Convert To
          </Dropdown.Toggle>

          <Dropdown.Menu className="flex mt-1 p-3"> {/* Adjusted margin-top to raise dropdown */}
            <div className="flex justify-between w-full gap-5">
              <div className="flex flex-col">
                <div className="nav__title text-black">Convert to PDF</div>
                <Dropdown.Item className="py-2 no-underline" href="/upload/jpegtopdf"> {/* Removed underline from the items */}
                  JPG to PDF
                </Dropdown.Item>
                <Dropdown.Item className="py-2 no-underline" href="/upload/wttopdf">
                  WORD to PDF
                </Dropdown.Item>
                <Dropdown.Item className="py-2 no-underline" href="/exceltopdf">
                  EXCEL to PDF
                </Dropdown.Item>
              </div>
            </div>
          </Dropdown.Menu>
        </Dropdown>

        <Dropdown drop="down" className="text-sm">
          <Dropdown.Toggle
            variant="link"
            className="text-black hover:text-red-500 cursor-pointer p-0 border-0 no-underline" // Removed underline here
            id="dropdown-basic"
          >
            All Options
          </Dropdown.Toggle>

          <Dropdown.Menu className="flex mt-1 p-3"> {/* Adjusted margin-top to raise dropdown */}
            <div className="flex justify-between w-full gap-5">
              <div className="flex flex-col">
                <div className="nav__title text-black">Organize PDF</div>
                <Dropdown.Item className="py-2 no-underline" href="/upload/merge"> {/* Removed underline from the items */}
                  Merge PDF
                </Dropdown.Item>
                <Dropdown.Item className="py-2 no-underline" href="/upload/split">
                  Split PDF
                </Dropdown.Item>
                <Dropdown.Item className="py-2 no-underline" href="/upload/removepages">
                  Remove pages
                </Dropdown.Item>
                <Dropdown.Item className="py-2 no-underline" href="/upload/extract">
                  Extract pages
                </Dropdown.Item>
                <Dropdown.Item className="py-2 no-underline" href="/upload/organize">
                  Organize PDF
                </Dropdown.Item>
              </div>
              <div className="flex flex-col">
                <div className="nav__title text-black">Optimize PDF</div>
                <Dropdown.Item className="py-2 no-underline" href="/upload/compress">
                  Compress PDF
                </Dropdown.Item>
                <Dropdown.Item className="py-2 no-underline" href="/upload/repair">
                  Repair PDF
                </Dropdown.Item>
              </div>
              <div className="flex flex-col">
                <div className="nav__title text-black">Convert to PDF</div>
                <Dropdown.Item className="py-2 no-underline" href="/upload/jpegtopdf">
                  JPG to PDF
                </Dropdown.Item>
                <Dropdown.Item className="py-2 no-underline" href="/upload/wtpdf">
                  WORD to PDF
                </Dropdown.Item>
              </div>
            </div>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      <div className="m-8 flex items-center justify-center gap-4 text-2xl text-black">
  <a href="https://github.com/DanGatobu" target="_blank" rel="noopener noreferrer">
    <FaGithub />
  </a>
  <a href="https://www.linkedin.com/in/dan-gatobu-012544214/" target="_blank" rel="noopener noreferrer">
    <FaLinkedin />
  </a>
</div>

    </nav>
  );
};

export default NavBar;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGithub, FaLinkedin, FaBars } from 'react-icons/fa';
import Dropdown from 'react-bootstrap/Dropdown';

const NavBar = () => {
  const [selectedAction, setSelectedAction] = useState('merge');
  const [menuOpen, setMenuOpen] = useState(false); // State to toggle menu visibility
  const navigate = useNavigate();

  const handleSelection = (action: 'merge' | 'split' | 'compress' | 'home') => {
    setSelectedAction(action);
    if (action === 'merge') navigate('/upload/merge');
    else if (action === 'split') navigate('/upload/split');
    else if (action === 'compress') navigate('/upload/compress');
    else if (action === 'home') navigate('/');
  };

  return (
    <nav className="mb-20 py-6 bg-white shadow-md">
      <div className="flex items-center justify-between px-4">
        {/* Left Navigation Section */}
        <div className="flex items-center gap-4">
          {/* Hamburger Menu Button (for small screens) */}
          <button
            className="lg:hidden text-xl text-black hover:text-red-500"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <FaBars />
          </button>

          {/* Main Navigation (visible on larger screens or when menu is open) */}
          <div
            className={`${
              menuOpen ? 'block' : 'hidden'
            } lg:flex flex-col lg:flex-row items-start lg:items-center gap-4`}
          >
            <button
              className={`text-sm ${
                selectedAction === 'home' ? 'text-red-500' : 'text-black'
              } hover:text-red-500`}
              onClick={() => handleSelection('home')}
            >
              Home
            </button>
            <button
              className={`text-sm ${
                selectedAction === 'merge' ? 'text-red-500' : 'text-black'
              } hover:text-red-500`}
              onClick={() => handleSelection('merge')}
            >
              Merge PDF
            </button>
            <button
              className={`text-sm ${
                selectedAction === 'split' ? 'text-red-500' : 'text-black'
              } hover:text-red-500`}
              onClick={() => handleSelection('split')}
            >
              Split PDF
            </button>
            <button
              className={`text-sm ${
                selectedAction === 'compress' ? 'text-red-500' : 'text-black'
              } hover:text-red-500`}
              onClick={() => handleSelection('compress')}
            >
              Compress PDF
            </button>

            {/* Dropdown Menus */}
            <Dropdown>
              <Dropdown.Toggle
                variant="link"
                className="text-sm text-black hover:text-red-500 p-0 border-0"
                id="convert-dropdown"
              >
                Convert To
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item href="/upload/jpegtopdf">JPG to PDF</Dropdown.Item>
                <Dropdown.Item href="/upload/wttopdf">Word to PDF</Dropdown.Item>
                <Dropdown.Item href="/upload/exceltopdf">Excel to PDF</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown>
              <Dropdown.Toggle
                variant="link"
                className="text-sm text-black hover:text-red-500 p-0 border-0"
                id="options-dropdown"
              >
                All Options
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item href="/upload/merge">Merge PDF</Dropdown.Item>
                <Dropdown.Item href="/upload/split">Split PDF</Dropdown.Item>
                <Dropdown.Item href="/upload/removepages">Remove Pages</Dropdown.Item>
                <Dropdown.Item href="/upload/compress">Compress PDF</Dropdown.Item>
                <Dropdown.Item href="/upload/repair">Repair PDF</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {/* Right Section: Social Icons */}
        <div className="m-8 flex items-center justify-center gap-4 text-2xl text-black">
          <a
            href="https://github.com/DanGatobu"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub />
          </a>
          <a
            href="https://www.linkedin.com/in/dan-gatobu-012544214/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaLinkedin />
          </a>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;

import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-6">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">VideoShare</h3>
            <p className="text-sm text-gray-400">Share your moments with the world</p>
          </div>
          <nav>
            <ul className="flex space-x-4">
              <li><Link to="/about" className="hover:text-gray-300">About</Link></li>
              <li><Link to="/privacy" className="hover:text-gray-300">Privacy</Link></li>
              <li><Link to="/terms" className="hover:text-gray-300">Terms</Link></li>
            </ul>
          </nav>
        </div>
        <div className="mt-4 text-center text-sm text-gray-400">
          © 2023 VideoShare. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

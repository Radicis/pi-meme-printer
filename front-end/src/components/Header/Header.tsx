import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircle,
  faCircleCheck,
  faCode,
  faHotdog
} from '@fortawesome/free-solid-svg-icons';

function Header({ printer, paper }: { printer?: boolean; paper?: boolean }) {
  return (
    <header className="flex text-lg text-cyan-600 md:gap-6">
      <div className="flex flex-1">
        <div className="flex flex-col md:flex-row md:gap-2 items-start md:items-center">
          <div className="gap-2 flex items-center">
            <FontAwesomeIcon className="hidden md:block" icon={faHotdog} />
            <span className="text-gray-100 font-medium">Hot! Meme Printer</span>
          </div>

          <span className="text-sm md:text-base">
            Click the tiles to show the printed image!
          </span>
        </div>
      </div>

      <div className="flex gap-2 flex-1 items-center flex-col md:flex-row">
        <div className="gap-2 flex items-center">
          <FontAwesomeIcon
            className={`rounded-full border border-gray-700 shadow ${
              printer ? 'text-green-600' : 'text-red-600'
            }`}
            icon={printer ? faCircleCheck : faCircle}
          />
          <span className="text-gray-100 font-medium select-none">Printer</span>
        </div>
        <div className="gap-2 flex items-center">
          <FontAwesomeIcon
            className={`rounded-full border border-gray-700 shadow ${
              paper ? 'text-green-600' : 'text-red-600'
            }`}
            icon={paper ? faCircleCheck : faCircle}
          />
          <span className="text-gray-100 font-medium select-none">Paper</span>
        </div>
      </div>

      <a
        href="https://github.com/Radicis/pi-image-printer"
        className="flex gap-2 items-center text-sm"
      >
        <FontAwesomeIcon icon={faCode} />
        <span className="hidden md:block">GitHub</span>
      </a>
    </header>
  );
}

export default Header;

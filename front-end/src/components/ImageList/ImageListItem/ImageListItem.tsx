import React from 'react';
import { Image } from '../../../services/images';

function ImageListItem({
  onSetSelected,
  image: { id, base64 }
}: {
  printerIsAvailable: boolean;
  onSetSelected: () => void;
  image: Image;
}) {
  return (
    <div
      onClick={onSetSelected}
      key={id}
      className="relative shadow cursor-pointer"
    >
      <img
        src={`data:image/jpeg;base64,${base64}`}
        alt={id}
        className="w-full h-full border hover:border-cyan-400 border-cyan-900"
      />
    </div>
  );
}

export default ImageListItem;

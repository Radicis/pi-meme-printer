import React from 'react';

import loading from '../../images/loading.gif';

function Loading() {
  return (
    <div className="fixed z-10 w-full h-full flex items-center justify-center p-12 text-lg">
      <img src={loading} alt="Loading" />
    </div>
  );
}

export default Loading;

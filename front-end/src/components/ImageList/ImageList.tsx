import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { getItem, Image } from '../../services/images';
import useWindowDimensions from '../../hooks/useWIndowDimensions';
import loading from '../../images/loading.gif';
import LightBox from './LightBox/LightBox';
import ImageListItem from './ImageListItem/ImageListItem';

type Column = ReactElement[];
type ColumnWrapper = Column[];

const GAP = 20;

function ImageList({
  images,
  printerIsAvailable,
  isFetchingNextPage,
  canLoadMore,
  fetchNextPage,
  updateImageWithNewCameraData
}: {
  images: Image[];
  printerIsAvailable: boolean;
  isFetchingNextPage: boolean;
  canLoadMore: boolean;
  fetchNextPage: () => void;
  updateImageWithNewCameraData: (id: string, camera64: string) => void;
}) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showLightbox, setShowLightbox] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<Image | undefined>();
  const [results, setResults] = useState<ReactElement[]>([]);
  const [columnCount, setColumnCount] = useState<number>(3);

  /**
   * Split up the results into equal columns of X = COLUMNS
   */
  const initColumns = () => {
    const createdColumns: ColumnWrapper = [];
    for (let i = 0; i < columnCount; i++) {
      createdColumns.push([]);
    }

    for (let i = 0; i < images.length; i++) {
      const columnIndex = i % columnCount;
      createdColumns[columnIndex]?.push(
        <div style={{ marginBottom: `${GAP}px` }} key={images[i].id}>
          <ImageListItem
            onSetSelected={() => {
              setSelectedImage(images[i]);
              setShowLightbox(true);
            }}
            printerIsAvailable={printerIsAvailable}
            image={images[i]}
          />
        </div>
      );
    }
    const results = [];
    for (let i = 0; i < columnCount; i++) {
      results.push(
        <div
          key={i}
          style={{
            marginLeft: `${i > 0 ? GAP : 0}px`,
            flex: 1
          }}
        >
          {createdColumns[i]}
        </div>
      );
    }
    setResults(results);
  };

  useEffect(() => {
    // EEEEEEEW Ugly breakpoint switch
    if (width < 576) {
      setColumnCount(2);
    } else if (images.length < 4 || width < 768) {
      setColumnCount(3);
    } else if (width < 992) {
      setColumnCount(4);
    } else if (width < 1200) {
      setColumnCount(5);
    } else if (width < 1400) {
      setColumnCount(6);
    } else {
      setColumnCount(7);
    }
  }, [width, images]);

  useEffect(() => {
    if (images.length > 0) {
      initColumns();
    }
  }, [images, columnCount]);

  const loadMore = async () => {
    if (!isFetchingNextPage && canLoadMore) {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        // added -100 here as it wasnt triggering on mobile and so it loads before you hit the bottom
        if (scrollTop + clientHeight >= scrollHeight - 100) {
          await fetchNextPage();
        }
      }
    }
  };

  return (
    <div
      className="relative flex justify-center overflow-auto"
      ref={scrollRef}
      onScroll={loadMore}
    >
      {images?.length === 0 ? (
        <div className="flex items-center justify-center lg:w-11/12 text-gray-200 text-lg py-12">
          No results..
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="flex lg:w-11/12">{results}</div>
          {isFetchingNextPage && (
            <div className="h-12 w-12 w-full flex items-center justify-center">
              <img src={loading} alt="Loading" />
            </div>
          )}
          {canLoadMore && (
            <button
              className="bg-gray-800 rounded-lg w-32 p-2 text-cyan-600"
              onClick={loadMore}
            >
              Load More
            </button>
          )}
        </div>
      )}
      <LightBox
        getUpdatedItem={getItem}
        printerIsAvailable={printerIsAvailable}
        open={showLightbox}
        image={selectedImage}
        onCancel={() => {
          setShowLightbox(false);
          setTimeout(() => {
            setSelectedImage(undefined);
          }, 250);
        }}
        updateImageWithNewCameraData={updateImageWithNewCameraData}
      />
    </div>
  );
}

export default ImageList;

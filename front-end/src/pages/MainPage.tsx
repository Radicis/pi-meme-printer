import React, { useEffect, useState } from 'react';
import Loading from '../components/Loading/Loading';
import Header from '../components/Header/Header';
import Error from '../components/Error/Error';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import UploadModal from '../components/modals/UploadModal/UploadModal';
import { getStatus, PrinterStatus } from '../services/status';
import loadImage from 'blueimp-load-image';
import { create, getItem, Image, list } from '../services/images';
import ImageList from '../components/ImageList/ImageList';

function MainPage() {
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState<boolean>(false);
  const [timer, setTimer] = useState<NodeJS.Timer | undefined>();
  const [status, setStatus] = useState<PrinterStatus>();

  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<
    | {
        createdAt: string;
        id: string;
      }
    | undefined
  >(undefined);

  const getImages = async () => {
    setError(false);
    setIsFetchingNextPage(true);
    try {
      const getParams: {
        limit: string;
        lastEvaluatedId?: string;
        lastEvaluatedCreatedAt?: string;
      } = {
        limit: '40'
      };
      if (lastEvaluatedKey) {
        getParams.lastEvaluatedCreatedAt = lastEvaluatedKey?.createdAt;
        getParams.lastEvaluatedId = lastEvaluatedKey?.id;
      }
      const { items, lastKey } = await list(getParams);
      if (lastKey) {
        // @ts-ignore
        setLastEvaluatedKey(lastKey);
      } else {
        setLastEvaluatedKey(undefined); // When no more results
      }
      setImages([...images, ...items]);
    } catch (e) {
      console.log(e);
      setError(true);
    } finally {
      setIsFetchingNextPage(false);
      setIsLoading(false);
    }
  };

  const updateImageWithNewCameraData = (id: string, camera64: string) => {
    setImages(
      images.map((i) => {
        if (i.id === id) {
          return {
            ...i,
            camera64
          };
        }
        return i;
      })
    );
  };

  useEffect(() => {
    // poll for the update
    getStatus().then((printerStatus: PrinterStatus) => {
      setStatus(printerStatus);
      setTimer(
        setInterval(async () => {
          const updatedStatus = await getStatus();
          setStatus(updatedStatus);
        }, 10000)
      );
    });

    return () => {
      setTimer(undefined);
      clearInterval(timer);
    };
  }, []);

  const handleCreate = async ({
    name,
    message,
    image
  }: {
    name?: string;
    message?: string;
    image?: File;
  }) => {
    if (!name || !image) {
      return;
    }

    const { image: scaledImage } = await loadImage(image, {
      maxWidth: 384,
      contain: true,
      maxHeight: 435,
      canvas: true
    });

    const createdImage = await create({
      name,
      message,
      image: (scaledImage as HTMLCanvasElement).toDataURL().split(',')[1]
    });

    // eslint-disable-next-line no-async-promise-executor
    return new Promise((res) => {
      setTimeout(async () => {
        const newImage = await getItem(createdImage.id);
        setImages((prevState) => [newImage, ...prevState]);
        res('ok');
      }, 5000);
    });
  };

  useEffect(() => {
    getImages();
  }, []);

  if (error) {
    return <Error />;
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="w-full h-screen flex flex-col gap-4 p-4">
      <Header printer={status?.printer} paper={status?.paper} />
      <ImageList
        printerIsAvailable={Boolean(status?.printer && status?.paper)}
        images={images}
        isFetchingNextPage={isFetchingNextPage}
        canLoadMore={!!lastEvaluatedKey}
        fetchNextPage={getImages}
        updateImageWithNewCameraData={updateImageWithNewCameraData}
      />
      <button
        type="button"
        onClick={() => setShowUploadModal(true)}
        className="h-16 w-16 flex items-center justify-center fixed bottom-4 right-4 md:bottom-12 md:right-12 inline-flex items-center p-1 rounded-full text-white bg-cyan-700 hover:bg-cyan-600 shadow"
      >
        <FontAwesomeIcon
          icon={faUpload}
          className="h-8 w-8"
          aria-hidden="true"
        />
      </button>
      <UploadModal
        printerIsAvailable={Boolean(status?.printer && status?.paper)}
        open={showUploadModal}
        onCancel={() => setShowUploadModal(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}

export default MainPage;

import React, { Fragment, useEffect, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose, faPrint, faUser } from '@fortawesome/free-solid-svg-icons';
import { Image } from '../../../services/images';

function LightBox({
  open,
  image,
  printerIsAvailable,
  getUpdatedItem,
  onCancel,
  updateImageWithNewCameraData
}: {
  printerIsAvailable: boolean;
  open: boolean;
  image?: Image;
  onCancel: () => void;
  getUpdatedItem: (id: string) => Promise<Image>;
  updateImageWithNewCameraData: (id: string, camera64: string) => void;
}) {
  const [localCamera64, setLocalCamera64] = useState<string | undefined>();
  const timer = useRef<NodeJS.Timer>();

  useEffect(() => {
    setLocalCamera64(undefined);
  }, [open]);

  useEffect(() => {
    if (image && !image.camera64 && printerIsAvailable) {
      // poll for the update
      timer.current = setInterval(async () => {
        const { camera64 } = await getUpdatedItem(image.id);
        if (camera64) {
          updateImageWithNewCameraData(image.id, camera64);
          setLocalCamera64(camera64);
          clearInterval(timer.current);
          timer.current = undefined;
        }
      }, 2000);
    } else {
      clearInterval(timer.current);
      timer.current = undefined;
    }
    return () => {
      clearInterval(timer.current);
      timer.current = undefined;
    };
  }, [image, printerIsAvailable]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative px-4 pt-5 mx-2 pb-4 bg-gray-100 flex text-left flex-col gap-6 rounded-lg overflow-hidden shadow-xl transform transition-all sm:my-8 w-full md:w-1/4">
                <div className="relative text-left flex justify-between gap-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg overflow-hidden overflow-ellipsis leading-6 font-medium text-gray-900 gap-4 flex  items-center"
                  >
                    <FontAwesomeIcon className="text-gray-400" icon={faUser} />
                    {image?.name}
                  </Dialog.Title>

                  <button>
                    <FontAwesomeIcon
                      icon={faClose}
                      onClick={onCancel}
                      className="h-6 w-6 text-gray-600 cursor-pointer"
                      aria-hidden="true"
                    />
                  </button>
                </div>
                <div className="flex items-center justify-center">
                  {image?.camera64 || localCamera64 ? (
                    <img
                      src={`data:image/jpeg;base64,${
                        image?.camera64 || localCamera64
                      }`}
                      className="max-h-fit"
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faPrint}
                      className="fa-beat-fade h-16 w-16 text-cyan-600"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span className="w-full items-center justify-center flex gap-2">
                  {image?.text}
                </span>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default LightBox;

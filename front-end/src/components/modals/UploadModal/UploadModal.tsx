import React, {
  Fragment,
  MutableRefObject,
  SyntheticEvent,
  useEffect,
  useRef,
  useState
} from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faHotdog,
  faSadCry,
  faUpload
} from '@fortawesome/free-solid-svg-icons';

type FormState = {
  name?: string;
  message?: string;
  image?: File;
};

function UploadModal({
  open,
  printerIsAvailable,
  onCancel,
  onSubmit
}: {
  open: boolean;
  printerIsAvailable: boolean;
  onCancel: () => void;
  onSubmit: (uploadData: FormState) => void;
}) {
  const [status, setStatus] = useState<
    'READY' | 'UPLOADING' | 'SUCCESS' | 'ERROR'
  >('READY');
  const [state, setState] = useState<FormState>({});
  const imageRef = useRef() as MutableRefObject<HTMLInputElement>;
  const [formIsValid, setFormIsValid] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setState({});
      setStatus('READY');
    }
  }, [open]);

  const handleSubmit = async (e: SyntheticEvent) => {
    setStatus('UPLOADING');
    e.preventDefault();
    try {
      await onSubmit(state);
      setStatus('SUCCESS');
    } catch (e) {
      console.log(e);
      setStatus('ERROR');
    } finally {
      setTimeout(() => {
        onCancel();
      }, 2000);
    }
    return false;
  };

  useEffect(() => {
    setFormIsValid(Boolean(state.name && state.image));
  }, [state.name, state.image]);

  const Uploading = () => {
    return (
      <div>
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-cyan-100">
          <FontAwesomeIcon
            icon={faUpload}
            className="fa-beat-fade h-6 w-6 text-cyan-600"
            aria-hidden="true"
          />
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <Dialog.Title
            as="h3"
            className="text-lg leading-6 font-medium text-gray-900"
          >
            Uploading...
          </Dialog.Title>
          <div className="mt-2">
            <p className="text-sm text-gray-500">Give it a moment..</p>
          </div>
        </div>
      </div>
    );
  };

  const Error = () => {
    return (
      <div>
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <FontAwesomeIcon
            icon={faSadCry}
            className="h-6 w-6 text-red-600"
            aria-hidden="true"
          />
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <Dialog.Title
            as="h3"
            className="text-lg leading-6 font-medium text-gray-900"
          >
            Upload Failed
          </Dialog.Title>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              It's probably some dodgy code. I'm sorry.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const Success = () => {
    return (
      <div>
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <FontAwesomeIcon
            icon={faCheck}
            className="h-6 w-6 text-green-600"
            aria-hidden="true"
          />
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <Dialog.Title
            as="h3"
            className="text-lg leading-6 font-medium text-gray-900"
          >
            Upload Successful!
          </Dialog.Title>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Give it a moment to print and capture the image.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        onClose={() =>
          !(status === 'UPLOADING' || status === 'SUCCESS') && onCancel()
        }
      >
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
              <Dialog.Panel className="relative px-4 pt-5 pb-4 bg-gray-100 flex text-left flex-col gap-6 rounded-lg overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-sm sm:w-full sm:p-6">
                {status === 'SUCCESS' && <Success />}
                {status === 'UPLOADING' && <Uploading />}
                {status === 'ERROR' && <Error />}

                {status === 'READY' && (
                  <div className="relative text-left flex flex-col gap-6">
                    <Dialog.Title
                      as="h3"
                      className="text-lg leading-6 font-medium text-gray-900"
                    >
                      Upload Something!
                    </Dialog.Title>
                    {formIsValid ? (
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="absolute top-1 right-2 h-6 w-6 text-green-600"
                        aria-hidden="true"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faHotdog}
                        className="absolute top-1 right-2 h-6 w-6 text-cyan-600"
                        aria-hidden="true"
                      />
                    )}
                    <form
                      className="flex flex-col gap-6"
                      onSubmit={handleSubmit}
                    >
                      <input
                        onChange={(e) => {
                          setState((prevState) => ({
                            ...prevState,
                            name: e.target.value
                          }));
                        }}
                        type="text"
                        name="name"
                        id="name"
                        maxLength={30}
                        required
                        className="shadow-sm block w-full p-2 rounded-lg"
                        placeholder="Type your name..."
                      />

                      <input
                        onChange={(e) => {
                          setState((prevState) => ({
                            ...prevState,
                            message: e.target.value
                          }));
                        }}
                        type="text"
                        name="message"
                        id="message"
                        maxLength={100}
                        className="shadow-sm block w-full p-2 rounded-lg"
                        placeholder="Want to add a message?"
                      />

                      <input
                        ref={imageRef}
                        onChange={(e) => {
                          setState((prevState) => ({
                            ...prevState,
                            image: e.target.files
                              ? e.target.files[0]
                              : undefined
                          }));
                        }}
                        type="file"
                        name="image"
                        required
                        className="hidden"
                        accept="image/*"
                      />

                      <button
                        type="button"
                        onClick={() => imageRef.current.click()}
                        className=" bg-white py-2 px-3 border overflow-ellipsis overflow-hidden border-gray-300 rounded-lg shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {state.image?.name
                          ? state.image.name
                          : 'Browse For an Image'}
                      </button>

                      {!printerIsAvailable && (
                        <div className="p-1 shadow rounded-lg w-full text-center bg-red-600 text-white">
                          Printer is Offline!
                        </div>
                      )}

                      <div className=" sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={!formIsValid}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-cyan-600 text-base font-medium text-white hover:bg-cyan-700 sm:ml-3 sm:w-auto sm:text-sm cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                        >
                          Upload
                        </button>
                        <button
                          type="button"
                          className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                          onClick={onCancel}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default UploadModal;

import React, { useState, useEffect } from "react";
import StaffForm from "./StaffForm";
import { Dialog, Transition } from "headlessui";
import { Fragment } from "react";
import Swal from "sweetalert2";
import axios from "axios";

const EditForm = ({ isOpen, onClose, requestId }) => {
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  // ================= Fetch existing request =================
  useEffect(() => {
    if (!requestId) return;

    const fetchRequest = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`https://backenduwleapprovalsystem.onrender.com/api/requests/${requestId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRequestData(res.data);
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Gagal fetch request", "error");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) fetchRequest();
  }, [requestId, isOpen]);

  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-2xl font-bold text-center mb-4">
                  Edit Request
                </Dialog.Title>

                {loading ? (
                  <p className="text-center text-gray-600">Loading request data...</p>
                ) : (
                  <StaffForm
                    initialData={requestData}
                    onClose={onClose} // ✅ close modal after submit
                  />
                )}

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded mt-2"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditForm;

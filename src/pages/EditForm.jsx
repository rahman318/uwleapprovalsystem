import React, { useState, useEffect } from "react";
import StaffForm from "./StaffForm";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Swal from "sweetalert2";
import axios from "axios";

const EditForm = ({ isOpen, onClose, requestId }) => {
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  // ================= Body scroll lock fix =================
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // ================= Fetch existing request =================
  useEffect(() => {
    if (!requestId || !isOpen) return;

    const fetchRequest = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `https://backenduwleapprovalsystem.onrender.com/api/requests/${requestId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("🔥 API RESPONSE:", res.data);

        setRequestData(res.data.request || res.data);
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Gagal fetch request", "error");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId, isOpen, token, onClose]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all">
                <Dialog.Title className="text-3xl font-extrabold text-center mb-6 text-gray-800">
                  Edit Request
                </Dialog.Title>

                {loading ? (
                  <p className="text-center text-gray-500 text-lg">Loading request data...</p>
                ) : (
                  <StaffForm
                    initialData={requestData}
                    onClose={onClose}
                    submitButtonClass="bg-blue-600 hover:bg-blue-700 text-white"
                  />
                )}

                <div className="mt-6 flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition-all"
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

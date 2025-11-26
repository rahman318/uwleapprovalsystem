import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

const ApproverSignaturePad = ({ onSave }) => {
  const sigRef = useRef(null);

  const clear = () => sigRef.current.clear();

  const save = () => {
    if (sigRef.current.isEmpty()) return alert("Sila buat tanda dahulu!");
    const dataURL = sigRef.current.toDataURL();
    onSave(dataURL); // hantar balik ke ApproverDashboard
  };

  return (
    <div className="border p-2 rounded bg-white">
      <p className="font-semibold mb-1">Approver Signature</p>

      <SignatureCanvas
        ref={sigRef}
        penColor="black"
        canvasProps={{
          width: 400,
          height: 150,
          className: "border rounded",
        }}
      />

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={clear}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Clear
        </button>

        <button
          type="button"
          onClick={save}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Save Signature
        </button>
      </div>
    </div>
  );
};

export default ApproverSignaturePad;
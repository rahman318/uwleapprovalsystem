import React, { useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";

const ApproverSignaturePad = ({ onChange }) => {
  const sigRef = useRef(null);

  // Clear signature
  const clear = () => {
    sigRef.current.clear();
    onChange(""); // kosongkan signature
  };

  // Auto capture bila user draw
  const handleEnd = () => {
    if (!sigRef.current.isEmpty()) {
      const dataURL = sigRef.current.toDataURL();
      onChange(dataURL); // terus hantar balik ke parent
    }
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
        onEnd={handleEnd} // auto capture bila selesai draw
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={clear}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default ApproverSignaturePad;

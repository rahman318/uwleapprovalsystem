import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

const SignaturePad = ({ onSave }) => {
  const sigRef = useRef(null);

  const clear = () => sigRef.current.clear();
  const save = () => {
    if (sigRef.current.isEmpty()) return alert("Sila tanda dahulu!");
    const dataURL = sigRef.current.toDataURL();
    onSave(dataURL);
  };

  return (
    <div className="border p-2 rounded">
      <SignatureCanvas
        ref={sigRef}
        penColor="black"
        canvasProps={{ width: 400, height: 150, className: "border" }}
      />
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={clear} className="bg-red-500 text-white px-3 py-1 rounded">Clear</button>
        <button type="button" onClick={save} className="bg-green-500 text-white px-3 py-1 rounded">Save</button>
      </div>
    </div>
  );
};

export default SignaturePad;
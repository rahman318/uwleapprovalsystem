import React, { forwardRef, useRef, useImperativeHandle } from "react";
import SignatureCanvas from "react-signature-canvas";

// ✅ Forward ref supaya parent (StaffForm) boleh panggil getSignature() & clear()
const SignaturePad = forwardRef((props, ref) => {
  const sigRef = useRef();

  useImperativeHandle(ref, () => ({
    getSignature: () => sigRef.current?.toDataURL() || null,
    clear: () => sigRef.current?.clear(),
  }));

  return (
    <div className="border p-2 rounded">
      <SignatureCanvas
        ref={sigRef}
        penColor="black"
        canvasProps={{ width: 400, height: 150, className: "border" }}
      />
    </div>
  );
});

export default SignaturePad;

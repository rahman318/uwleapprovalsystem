import Swal from "sweetalert2";

function ApproverList({ requests, setRequests }) {
  const handleDecision = async (id, decision) => {
    setRequests(
      await Promise.all(
        requests.map(async (req) => {
          if (req.id !== id) return req;

          const approvals = [...req.approvals];
          const currentApprover = approvals[req.currentLevel];
          let reason = null;
          let newStatus = req.status;
          let nextLevel = req.currentLevel;

          if (decision === "Rejected") {
            const { value } = await Swal.fire({
              title: "Sila nyatakan sebab ditolak",
              input: "text",
              inputPlaceholder: "Contoh: Dokumen tidak lengkap",
              showCancelButton: true,
              confirmButtonText: "Hantar",
              cancelButtonText: "Batal",
            });

            if (!value) return req; // batal reject
            reason = value;

            approvals[req.currentLevel] = {
              ...currentApprover,
              decision,
              reason,
            };
            newStatus = "Rejected";

            Swal.fire({
              icon: "error",
              title: "Permohonan Ditolak ❌",
              text: `Sebab: ${reason}`,
            });
          } else if (decision === "Approved") {
            approvals[req.currentLevel] = {
              ...currentApprover,
              decision,
              reason: null,
            };

            if (req.currentLevel < approvals.length - 1) {
              nextLevel++;
              newStatus = "Pending";
            } else {
              newStatus = "Approved";
              Swal.fire({
                icon: "success",
                title: "Permohonan Diluluskan ✅",
                timer: 2000,
                showConfirmButton: false,
              });
            }
          }

          return {
            ...req,
            approvals,
            status: newStatus,
            currentLevel: nextLevel,
          };
        })
      )
    );
  };

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <div key={req.id} className="p-4 bg-white rounded shadow">
          <h2 className="font-semibold">{req.title}</h2>
          <p className="text-sm text-gray-600">{req.description}</p>
          <p className="mt-2 font-bold">
            Status:{" "}
            <span
              className={
                req.status === "Approved"
                  ? "text-green-600"
                  : req.status === "Rejected"
                  ? "text-red-600"
                  : "text-yellow-600"
              }
            >
              {req.status}
            </span>
          </p>

          <ul className="text-sm mt-2">
            {req.approvals.map((appr, i) => (
              <li key={i}>
                {appr.approver} →{" "}
                {appr.decision ? appr.decision : "Pending"}
                {appr.reason && (
                  <span className="text-red-600"> (Sebab: {appr.reason})</span>
                )}
              </li>
            ))}
          </ul>

          {/* Butang hanya keluar kalau giliran dia */}
          {req.status === "Pending" && (
            <div className="mt-3 space-x-2">
              <button
                onClick={() => handleDecision(req.id, "Approved")}
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                Approve
              </button>
              <button
                onClick={() => handleDecision(req.id, "Rejected")}
                className="px-3 py-1 bg-red-600 text-white rounded"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ApproverList;
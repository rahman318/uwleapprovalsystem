import { useEffect, useState } from "react";
import axios from "axios";

const ItemsTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: 0,
    unit: "pcs",
    minStock: 5,
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "https://backenduwleapprovalsystem.onrender.com/api/inventory"
      );

      const data = res.data?.data || res.data || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await axios.post(
      "https://backenduwleapprovalsystem.onrender.com/api/inventory",
      form
    );

    setForm({
      name: "",
      category: "",
      quantity: 0,
      unit: "pcs",
      minStock: 5,
    });

    fetchItems();
  };

  const handleDelete = async (id) => {
    await axios.delete(
      `https://backenduwleapprovalsystem.onrender.com/api/inventory/${id}`
    );
    fetchItems();
  };

  return (
    <div className="space-y-6">

      {/* FORM CARD */}
      <div className="bg-white p-4 rounded-2xl shadow border">
        <h2 className="font-bold mb-3">➕ Add Inventory Item</h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-5 gap-2"
        >
          <input
            placeholder="Item Name"
            className="border p-2 rounded-lg focus:outline-blue-400"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            placeholder="Category"
            className="border p-2 rounded-lg"
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Qty"
            className="border p-2 rounded-lg"
            value={form.quantity}
            onChange={(e) =>
              setForm({ ...form, quantity: Number(e.target.value) })
            }
          />

          <input
            placeholder="Unit"
            className="border p-2 rounded-lg"
            value={form.unit}
            onChange={(e) =>
              setForm({ ...form, unit: e.target.value })
            }
          />

          <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
            + Add
          </button>
        </form>
      </div>

      {/* LOADING */}
      {loading && (
        <p className="text-gray-500">Loading inventory...</p>
      )}

      {/* TABLE CARD */}
      <div className="bg-white rounded-2xl shadow border overflow-hidden">

        {/* HEADER */}
        <div className="p-4 border-b bg-gray-50 flex justify-between">
          <h2 className="font-bold">📦 Inventory List</h2>
          <span className="text-sm text-gray-500">
            Total: {items.length}
          </span>
        </div>

        {/* TABLE */}
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {Array.isArray(items) &&
              items.map((item) => {
                const lowStock =
                  item.quantity < item.minStock;

                return (
                  <tr
                    key={item._id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="p-3 font-medium">
                      {item.name}
                    </td>

                    <td className="p-3 text-gray-600">
                      {item.category}
                    </td>

                    <td className="p-3">
                      {item.quantity} {item.unit}
                    </td>

                    {/* STATUS BADGE */}
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          lowStock
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {lowStock ? "LOW STOCK" : "OK"}
                      </span>
                    </td>

                    {/* ACTION */}
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-500 hover:text-red-700 font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {/* EMPTY STATE */}
        {!loading && items.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            📦 No inventory items found
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemsTab;

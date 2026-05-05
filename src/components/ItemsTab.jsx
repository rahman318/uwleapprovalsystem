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

  // 🔥 SAFE FETCH (FIX MAP ERROR)
  const fetchItems = async () => {
    try {
      setLoading(true);

      const res = await axios.get("/api/inventory");

      console.log("🔥 INVENTORY API:", res.data);

      // 🔥 HANDLE DIFFERENT API STRUCTURE SAFELY
      const data = res.data?.data || res.data || [];

      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Inventory fetch error:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // ➕ ADD ITEM
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("/api/inventory", form);

      setForm({
        name: "",
        category: "",
        quantity: 0,
        unit: "pcs",
        minStock: 5,
      });

      fetchItems();
    } catch (error) {
      console.error("Add item error:", error);
    }
  };

  // ❌ DELETE ITEM
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/inventory/${id}`);
      fetchItems();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div>
      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-5 gap-2 mb-6"
      >
        <input
          placeholder="Item Name"
          className="border p-2 rounded"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Category"
          className="border p-2 rounded"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />

        <input
          type="number"
          placeholder="Qty"
          className="border p-2 rounded"
          value={form.quantity}
          onChange={(e) =>
            setForm({ ...form, quantity: Number(e.target.value) })
          }
        />

        <input
          placeholder="Unit"
          className="border p-2 rounded"
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
        />

        <input
          type="number"
          placeholder="Min Stock"
          className="border p-2 rounded"
          value={form.minStock}
          onChange={(e) =>
            setForm({ ...form, minStock: Number(e.target.value) })
          }
        />

        <button className="bg-blue-500 text-white rounded">
          + Add
        </button>
      </form>

      {/* LOADING */}
      {loading && (
        <p className="text-gray-500 mb-4">Loading inventory...</p>
      )}

      {/* TABLE */}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th>Name</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Min</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {/* 🔥 SAFE MAP (NO CRASH) */}
          {Array.isArray(items) &&
            items.map((item) => (
              <tr
                key={item._id}
                className="border-b hover:bg-gray-50"
              >
                <td>{item.name}</td>
                <td>{item.category}</td>

                <td
                  className={
                    item.quantity < item.minStock
                      ? "text-red-500 font-bold"
                      : ""
                  }
                >
                  {item.quantity} {item.unit}
                </td>

                <td>{item.minStock}</td>

                <td>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="text-red-500"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* EMPTY STATE */}
      {!loading && items.length === 0 && (
        <p className="text-gray-400 mt-4">
          No inventory items found 📦
        </p>
      )}
    </div>
  );
};

export default ItemsTab;

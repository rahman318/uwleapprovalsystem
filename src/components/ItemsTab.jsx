import { useEffect, useState } from "react";
import axios from "axios";

const ItemsTab = () => {
  const [items, setItems] = useState([]);
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
    const res = await axios.get("/api/inventory");
    setItems(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("/api/inventory", form);
    setForm({ name: "", category: "", quantity: 0, unit: "pcs", minStock: 5 });
    fetchItems();
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/inventory/${id}`);
    fetchItems();
  };

  return (
    <div>
      {/* FORM */}
      <form onSubmit={handleSubmit} className="grid grid-cols-5 gap-2 mb-6">
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

        <button className="bg-blue-500 text-white rounded">
          + Add
        </button>
      </form>

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
          {items.map((item) => (
            <tr key={item._id} className="border-b hover:bg-gray-50">
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
    </div>
  );
};

export default ItemsTab;
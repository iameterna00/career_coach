import { useState, useEffect } from "react";
import { webApi } from "./api/api";
import { X } from "lucide-react";

export function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch(`${webApi}/leads`);
      if (!response.ok) throw new Error("Failed to fetch leads");
      const data = await response.json();
      setLeads(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${webApi}/clear-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to clear leads");

      const data = await res.json();
      console.log("Leads cleared:", data);
      alert(data.message);
      setLeads([]); // Clear local state
    } catch (err) {
      console.error("Error clearing leads:", err);
      alert("Error clearing leads");
    }
  };

  // Dynamically get headers for non-empty fields across all leads
  const allKeys = leads.length
    ? Array.from(
        new Set(
          leads.flatMap((lead) =>
            Object.keys(lead).filter((key) => key !== "id" && lead[key])
          )
        )
      )
    : [];

  return (
    <div className="h-screen w-screen p-4 bg-gray-900">
      <h1 className="text-2xl font-bold mb-6 text-white">Available Leads</h1>

      {/* Empty State */}
      {!loading && leads.length === 0 && (
        <div className="flex items-center justify-center w-full h-[70vh] flex-col">
          <p className="text-gray-400">No leads found.</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse animate-pulse">
            <thead className="bg-gray-800">
              <tr>
                {[...Array(5)].map((_, i) => (
                  <th key={i} className="px-4 py-2 text-left text-gray-500">
                    &nbsp;
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((skeleton) => (
                <tr key={skeleton}>
                  {[...Array(5)].map((_, i) => (
                    <td key={i} className="px-4 py-3">
                      <div className="h-4 w-full bg-gray-700 rounded"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Data Table */}
      {!loading && leads.length > 0 && (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm border-collapse rounded-lg shadow">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-gray-300">#</th>
                {allKeys.map((key) => (
                  <th
                    key={key}
                    className="px-4 py-2 text-left text-gray-300 whitespace-nowrap"
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </th>
                ))}
                <th className="px-4 py-2 text-left text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, idx) => {
                // Only show fields with values
                const filledKeys = allKeys.filter((key) => lead[key]);
                return (
                  <tr
                    key={idx}
                    className="group hover:bg-gray-800 transition text-gray-200"
                  >
                    <td className="px-4 py-2 border-t border-gray-700">{idx + 1}</td>
                    {filledKeys.map((key) => (
                      <td
                        key={key}
                        className="px-4 py-2 border-t border-gray-700 whitespace-normal"
                      >
                        {lead[key]}
                      </td>
                    ))}
                    <td className="px-4 py-2 border-t border-gray-700">
                      <button
                        onClick={handleDelete}
                        className="opacity-0 group-hover:opacity-100 transition bg-red-500 text-white rounded p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {error && <div className="text-red-400 mt-4 text-center">{error}</div>}
    </div>
  );
}

export default Leads;

import React, { useState, useEffect } from "react";
import { getTallySyncLogs, TallySyncLog } from "../lib/db";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";

export const SyncLogs: React.FC = () => {
  const { translate } = useLanguage();
  const [logs, setLogs] = useState<TallySyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const logsData = await getTallySyncLogs();
      setLogs(logsData);
      setError(null);
    } catch (err) {
      setError(translate(translations.failedToLoadData) + " " + (err instanceof Error ? err.message : String(err)));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusTranslation = (status: string) => {
    switch (status) {
      case "success":
        return translate("Success");
      case "failed":
        return translate("Failed");
      case "pending":
        return translate("Pending");
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">{translate(translations.syncLogs)}</h1>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? translate("Refreshing...") : translate("Refresh")}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-300">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{translate(translations.date)}</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{translate("Entity Type")}</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{translate("XML Type")}</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{translate(translations.status)}</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{translate("Error")}</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-600 text-sm">
                  {translate("No sync logs yet. Send XML to Tally to see logs here.")}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">{formatDate(log.created_at)}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{log.entity_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{log.xml_type}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        log.status
                      )}`}
                    >
                      {getStatusTranslation(log.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600">
                    {log.error_message || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

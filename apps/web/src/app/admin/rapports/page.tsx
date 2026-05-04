'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { FiDownload, FiFileText } from 'react-icons/fi';

interface ReportData {
  date: string;
  client: string;
  vehicle: string;
  duree: string;
  montantHT: string;
  tva: string;
  montantTTC: string;
  modePaiement: string;
  statut: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<ReportData[]>([]);
  const [summary, setSummary] = useState({
    totalReservations: 0,
    caTotal: 0,
    caCard: 0,
    caCash: 0,
    caTransfer: 0,
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/connexion');
      return;
    }
    fetchReport();
  }, [isAuthenticated, user, from, to]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await adminApi.exportData('json', from, to);
      const reportData = res.data?.data || [];
      setData(reportData);

      const caCard = reportData
        .filter((r: ReportData) => r.modePaiement === 'CARD')
        .reduce((acc: number, r: ReportData) => acc + parseFloat(r.montantTTC), 0);
      const caCash = reportData
        .filter((r: ReportData) => r.modePaiement === 'CASH')
        .reduce((acc: number, r: ReportData) => acc + parseFloat(r.montantTTC), 0);
      const caTransfer = reportData
        .filter((r: ReportData) => r.modePaiement === 'TRANSFER')
        .reduce((acc: number, r: ReportData) => acc + parseFloat(r.montantTTC), 0);

      setSummary({
        totalReservations: reportData.length,
        caTotal: reportData.reduce((acc: number, r: ReportData) => acc + parseFloat(r.montantTTC), 0),
        caCard,
        caCash,
        caTransfer,
      });
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await adminApi.exportData('csv', from, to);
      const blob = new Blob([res.data.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_${from}_${to}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Erreur lors de l\'export CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      const res = await adminApi.exportData('pdf', from, to);
      const blob = new Blob([atob(res.data.data)], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_${from}_${to}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Erreur lors de l\'export PDF');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rapports</h1>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <FiDownload /> Exporter CSV
          </button>
          <button
            onClick={handleExportPDF}
            disabled={loading}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <FiFileText /> Exporter PDF
          </button>
        </div>
      </div>

      {/* Filtres période */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Du</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Au</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-1">Total Réservations</div>
          <div className="text-2xl font-bold">{summary.totalReservations}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-1">CA Total</div>
          <div className="text-2xl font-bold text-green-600">{formatPrice(summary.caTotal)}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-1">CB</div>
          <div className="text-2xl font-bold text-blue-600">{formatPrice(summary.caCard)}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-1">Espèces</div>
          <div className="text-2xl font-bold text-orange-600">{formatPrice(summary.caCash)}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-1">Virement</div>
          <div className="text-2xl font-bold text-purple-600">{formatPrice(summary.caTransfer)}</div>
        </div>
      </div>

      {/* Tableau détaillé */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4">Date</th>
              <th className="text-left py-3 px-4">Client</th>
              <th className="text-left py-3 px-4">Véhicule</th>
              <th className="text-left py-3 px-4">Durée</th>
              <th className="text-right py-3 px-4">HT</th>
              <th className="text-right py-3 px-4">TVA</th>
              <th className="text-right py-3 px-4">TTC</th>
              <th className="text-left py-3 px-4">Mode</th>
              <th className="text-left py-3 px-4">Statut</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-8">Chargement...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-500">
                  Aucune donnée pour cette période
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{item.date}</td>
                  <td className="py-3 px-4">{item.client}</td>
                  <td className="py-3 px-4">{item.vehicle}</td>
                  <td className="py-3 px-4 text-sm">{item.duree}</td>
                  <td className="py-3 px-4 text-right">{item.montantHT} MAD</td>
                  <td className="py-3 px-4 text-right">{item.tva} MAD</td>
                  <td className="py-3 px-4 text-right font-medium">{item.montantTTC} MAD</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.modePaiement === 'CARD' ? 'bg-blue-100 text-blue-800' :
                      item.modePaiement === 'CASH' ? 'bg-orange-100 text-orange-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {item.modePaiement === 'CARD' ? 'CB' : item.modePaiement === 'CASH' ? 'Espèces' : 'Virement'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.statut === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      item.statut === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.statut === 'COMPLETED' ? 'Terminée' : 
                       item.statut === 'CANCELLED' ? 'Annulée' : 
                       item.statut === 'ACTIVE' ? 'En cours' : 'En attente'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totaux */}
      {data.length > 0 && (
        <div className="mt-4 bg-white rounded-lg shadow-sm p-4 flex justify-end gap-8">
          <div className="text-right">
            <div className="text-sm text-gray-500">Total HT</div>
            <div className="font-bold text-lg">
              {formatPrice(data.reduce((acc, r) => acc + parseFloat(r.montantHT), 0))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total TVA</div>
            <div className="font-bold text-lg">
              {formatPrice(data.reduce((acc, r) => acc + parseFloat(r.tva), 0))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total TTC</div>
            <div className="font-bold text-lg text-green-600">
              {formatPrice(data.reduce((acc, r) => acc + parseFloat(r.montantTTC), 0))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
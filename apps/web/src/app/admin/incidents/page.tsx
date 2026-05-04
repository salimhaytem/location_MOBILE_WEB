'use client';
import { useState, useEffect } from 'react';

interface Incident {
  id: string;
  type: string;
  description: string;
  photos: string[];
  status: string;
  adminNote: string | null;
  createdAt: string;
  vehicle: { brand: string; model: string; registrationNumber: string };
  agent: { firstName: string; lastName: string };
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchIncidents();
  }, [filter]);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/admin/incidents?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setIncidents(data);
    } catch (e) {
      console.error('Error:', e);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/admin/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      alert('Statut mis à jour');
      fetchIncidents();
    } catch (e) {
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleSaveNote = async () => {
    if (!selectedIncident) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/admin/incidents/${selectedIncident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adminNote: note }),
      });
      alert('Note sauvegardée');
      fetchIncidents();
    } catch (e) {
      alert('Erreur');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      RESOLVED: 'bg-green-100 text-green-800',
    };
    const labels: Record<string, string> = {
      OPEN: 'Ouvert',
      IN_PROGRESS: 'En cours',
      RESOLVED: 'Résolu',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      DAMAGE: 'Dommage',
      ACCIDENT: 'Accident',
      MECHANICAL: 'Panne mécanique',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-6">
        <h1 className="text-2xl font-bold">Gestion des incidents</h1>
      </header>

      <div className="p-6">
        <div className="flex gap-2 mb-6">
          {['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm ${
                filter === status ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
              }`}
            >
              {status === 'all' ? 'Tous' : status === 'OPEN' ? 'Ouverts' : status === 'IN_PROGRESS' ? 'En cours' : 'Résolus'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-10">Chargement...</div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Aucun incident</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Véhicule</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Signalé par</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{incident.vehicle.brand} {incident.vehicle.model}</div>
                      <div className="text-xs text-gray-500">{incident.vehicle.registrationNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{getTypeLabel(incident.type)}</td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">{incident.description}</td>
                    <td className="px-4 py-3 text-sm">{incident.agent.firstName} {incident.agent.lastName}</td>
                    <td className="px-4 py-3">{getStatusBadge(incident.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(incident.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedIncident(incident);
                          setNote(incident.adminNote || '');
                        }}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Gérer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Incident - {selectedIncident.vehicle.brand} {selectedIncident.vehicle.model}</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-gray-600">Type</label>
                <p className="font-medium">{getTypeLabel(selectedIncident.type)}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Description</label>
                <p className="text-sm">{selectedIncident.description}</p>
              </div>

              {selectedIncident.photos?.length > 0 && (
                <div>
                  <label className="text-sm text-gray-600">Photos</label>
                  <div className="flex gap-2 mt-2">
                    {selectedIncident.photos.map((photo, i) => (
                      <img key={i} src={photo} alt={`Photo ${i + 1}`} className="w-20 h-20 object-cover rounded" />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-600">Statut</label>
                <div className="flex gap-2 mt-2">
{['OPEN', 'IN_PROGRESS', 'RESOLVED'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedIncident.id, status)}
                        className={`px-3 py-1 rounded text-sm ${
                          selectedIncident.status === status ? 'bg-blue-600 text-white' : 'bg-gray-100'
                        }`}
                      >
                        {status === 'OPEN' ? 'Ouvert' : status === 'IN_PROGRESS' ? 'En cours' : 'Résolu'}
                      </button>
                    ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Note interne</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-2 border rounded mt-1 text-sm"
                  rows={3}
                  placeholder="Ajouter une note interne..."
                />
                <button
                  onClick={handleSaveNote}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Sauvegarder la note
                </button>
              </div>
            </div>

            <button
              onClick={() => setSelectedIncident(null)}
              className="w-full px-4 py-2 border rounded hover:bg-gray-50"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
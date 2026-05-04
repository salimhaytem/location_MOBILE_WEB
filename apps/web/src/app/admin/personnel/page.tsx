'use client';
import { useState, useEffect } from 'react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
}

export default function PersonnelPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('PERSONNEL');

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/users?role=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error('Error:', e);
    }
    setLoading(false);
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-800',
      PERSONNEL: 'bg-blue-100 text-blue-800',
      CLIENT: 'bg-green-100 text-green-800',
    };
    const labels: Record<string, string> = {
      ADMIN: 'Admin',
      PERSONNEL: 'Staff',
      CLIENT: 'Client',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[role] || 'bg-gray-100'}`}>
        {labels[role] || role}
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion du personnel</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {['PERSONNEL', 'ADMIN', 'CLIENT'].map((role) => (
          <button
            key={role}
            onClick={() => setFilter(role)}
            className={`px-4 py-2 rounded-lg text-sm ${
              filter === role ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
            }`}
          >
            {role === 'PERSONNEL' ? 'Staff' : role === 'ADMIN' ? 'Admins' : 'Clients'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10">Chargement...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-10 text-gray-500">Aucun utilisateur</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Nom</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Téléphone</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Rôle</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Créé le</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm">{user.email}</td>
                  <td className="px-4 py-3 text-sm">{user.phone || '-'}</td>
                  <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
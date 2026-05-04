'use client';
import { useState, useEffect } from 'react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  isPublished: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  reservation: {
    vehicle: { brand: string; model: string };
  };
}

export default function AvisPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'published'>('pending');

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const status = filter === 'pending' ? 'pending' : 'published';
      const res = await fetch(`http://localhost:4000/admin/reviews?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReviews(data);
    } catch (e) {
      console.error('Error:', e);
    }
    setLoading(false);
  };

  const handleModerate = async (id: string, action: 'publish' | 'reject') => {
    if (!confirm(action === 'publish' ? 'Publier cet avis?' : 'Rejeter et supprimer cet avis?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      alert(action === 'publish' ? 'Avis publié!' : 'Avis rejeté');
      fetchReviews();
    } catch (e) {
      alert('Erreur lors de la modération');
    }
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-6">
        <h1 className="text-2xl font-bold">Modération des avis</h1>
      </header>

      <div className="p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
            }`}
          >
            En attente ({reviews.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'published' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
            }`}
          >
            Publiés
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10">Chargement...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            {filter === 'pending' ? 'Aucun avis en attente de modération' : 'Aucun avis publié'}
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-yellow-500 text-xl">{renderStars(review.rating)}</span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        review.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {review.isPublished ? 'Publié' : 'En attente'}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{review.comment || 'Pas de commentaire'}</p>
                    
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">{review.user.firstName} {review.user.lastName}</span>
                      {' • '}
                      <span>{review.reservation.vehicle.brand} {review.reservation.vehicle.model}</span>
                      {' • '}
                      <span>{new Date(review.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  {!review.isPublished && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleModerate(review.id, 'publish')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Publier
                      </button>
                      <button
                        onClick={() => handleModerate(review.id, 'reject')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Rejeter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
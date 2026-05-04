import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">CarLoc</h1>
          <nav className="flex gap-4">
            <Link href="/vehicules" className="text-gray-600 hover:text-primary-600">
              Véhicules
            </Link>
            <Link href="/connexion" className="text-gray-600 hover:text-primary-600">
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              S'inscrire
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Louez votre voiture idéale
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Une large gamme de véhicules pour tous vos besoins. Réservation simple,
            prix transparents, service de qualité.
          </p>

          {/* Search Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-4xl mx-auto">
            <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu de prise en charge
                </label>
                <input
                  type="text"
                  placeholder="Ville ou aéroport"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de départ
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de retour
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 font-medium"
                >
                  Rechercher
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Pourquoi choisir CarLoc ?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚗</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Large flotte de véhicules</h4>
              <p className="text-gray-600">
                Des citadines aux SUV, trouvez le véhicule parfait pour vos besoins
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Prix transparents</h4>
              <p className="text-gray-600">
                Pas de frais cachés, des tarifs clairs et compétitifs
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⭐</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Service de qualité</h4>
              <p className="text-gray-600">
                Support client disponible 7j/7, livraison rapide
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h5 className="text-lg font-bold mb-4">CarLoc</h5>
            <p className="text-gray-400">Votre partenaire de confiance pour la location de véhicules</p>
          </div>
          <div>
            <h5 className="text-lg font-bold mb-4">Liens rapides</h5>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/vehicules">Nos véhicules</Link></li>
              <li><Link href="/reservations">Mes réservations</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-lg font-bold mb-4">Légal</h5>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/cgu">CGV</Link></li>
              <li><Link href="/mentions-legales">Mentions légales</Link></li>
              <li><Link href="/confidentialite">Confidentialité</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-lg font-bold mb-4">Contact</h5>
            <p className="text-gray-400">contact@carloc.fr</p>
            <p className="text-gray-400">+33 1 23 45 67 89</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          © 2026 CarLoc. Tous droits réservés.
        </div>
      </footer>
    </main>
  );
}
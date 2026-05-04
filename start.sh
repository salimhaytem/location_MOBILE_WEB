#!/bin/bash

echo "🚗 Démarrage CarLoc..."

# Backend
echo "📦 Installation backend..."
cd apps/backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed &
BACKEND_PID=$!

cd ../..

# Web
echo "📦 Installation web..."
cd apps/web
npm install &
WEB_PID=$!

cd ../..

echo ""
echo "⏳ Attente des services..."
sleep 5

echo ""
echo "=========================================="
echo "✅ Services démarrés avec succès!"
echo "=========================================="
echo ""
echo "🔹 Backend API:  http://localhost:4000"
echo "🔹 Frontend Web: http://localhost:3000"
echo ""
echo "📱 Pour les apps mobiles:"
echo "   Mobile Client:  cd apps/mobile && npx expo start"
echo "   Mobile Staff:   cd apps/mobile-staff && npx expo start"
echo ""
echo "🔑 Comptes de test:"
echo "   Admin:  admin@carloc.ma / Admin123!"
echo "   Staff:  staff1@carloc.ma / Staff123!"
echo "   Client: client1@carloc.ma / Client123!"
echo ""
echo "=========================================="
echo "🛑 Pour arrêter: Ctrl+C"
echo "=========================================="
import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const sendgridKey = this.configService.get('SENDGRID_API_KEY');
    if (sendgridKey) {
      sgMail.setApiKey(sendgridKey);
    }
  }

  async getDashboard() {
    const totalVehicles = await this.prisma.vehicle.count();
    const availableVehicles = await this.prisma.vehicle.count({ where: { status: 'AVAILABLE' } });
    const totalReservations = await this.prisma.reservation.count();
    const activeReservations = await this.prisma.reservation.count({ where: { status: 'ACTIVE' } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayReservations = await this.prisma.reservation.count({
      where: {
        pickupDate: { gte: today, lt: tomorrow },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    const recentRevenue = await this.prisma.reservation.aggregate({
      where: { status: 'COMPLETED', updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      _sum: { totalPrice: true },
    });

    const pendingCashPayments = await this.prisma.reservation.aggregate({
      where: { status: { in: ['PENDING', 'CONFIRMED'] } },
      _sum: { totalPrice: true },
    });

    const vehiclesByCategory = await this.prisma.vehicle.groupBy({
      by: ['categoryId'],
      _count: { id: true },
    });

    return {
      totalVehicles,
      availableVehicles,
      totalReservations,
      activeReservations,
      todayReservations,
      monthlyRevenue: recentRevenue._sum.totalPrice || 0,
      occupancyRate: totalVehicles > 0 ? ((totalVehicles - activeReservations) / totalVehicles) * 100 : 0,
      pendingCashPayments: pendingCashPayments._sum.totalPrice || 0,
    };
  }

  async getTodayReservations() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.reservation.findMany({
      where: {
        OR: [
          { pickupDate: { gte: today, lt: tomorrow } },
          { returnDate: { gte: today, lt: tomorrow } },
        ],
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        vehicle: { select: { brand: true, model: true } },
      },
      orderBy: { pickupDate: 'asc' },
    });
  }

  async getRevenueChart() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        status: 'COMPLETED',
        updatedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { updatedAt: 'asc' },
    });

    const dailyRevenue: Record<string, number> = {};
    reservations.forEach((r) => {
      const date = new Date(r.updatedAt).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + r.totalPrice;
    });

    const chartData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      chartData.push({
        date: dateStr,
        revenue: dailyRevenue[dateStr] || 0,
      });
    }

    return chartData;
  }

  async getCashJournal(date?: string) {
    const targetDate = date ? new Date(date) : new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setDate(endDate.getDate() + 1);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        status: { in: ['COMPLETED', 'CONFIRMED'] },
        createdAt: { gte: targetDate, lt: endDate },
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        vehicle: { select: { brand: true, model: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCash = reservations.reduce((acc, r) => acc + r.totalPrice, 0);

    return {
      totalCash,
      transactions: reservations.map((r) => ({
        id: r.id,
        client: `${r.user.firstName} ${r.user.lastName}`,
        vehicle: `${r.vehicle.brand} ${r.vehicle.model}`,
        amount: r.totalPrice,
        time: r.createdAt.toISOString(),
      })),
    };
  }

  async getFinancialReport(startDate: string, endDate: string) {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: { vehicle: true },
    });

    const totalRevenue = reservations.reduce((acc, r) => acc + r.totalPrice, 0);
    const byVehicle: Record<string, number> = {};

    reservations.forEach((r) => {
      const key = `${r.vehicle.brand} ${r.vehicle.model}`;
      byVehicle[key] = (byVehicle[key] || 0) + r.totalPrice;
    });

    return { totalRevenue, reservationCount: reservations.length, byVehicle, reservations };
  }

  async exportData(format: string, from?: string, to?: string) {
    const where: any = {};

    if (from && to) {
      where.createdAt = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const reservations = await this.prisma.reservation.findMany({
      where,
      include: {
        vehicle: { include: { category: true } },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = reservations.map((r) => {
      const days = Math.ceil(
        (new Date(r.returnDate).getTime() - new Date(r.pickupDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const ht = r.totalPrice / 1.2;
      const tva = r.totalPrice - ht;

      return {
        date: new Date(r.createdAt).toLocaleDateString('fr-FR'),
        client: `${r.user.firstName} ${r.user.lastName}`,
        vehicle: `${r.vehicle.brand} ${r.vehicle.model}`,
        duree: `${days} jour(s)`,
        montantHT: ht.toFixed(2),
        tva: tva.toFixed(2),
        montantTTC: r.totalPrice.toFixed(2),
        modePaiement: r.paymentMethod || 'CASH',
        statut: r.status,
      };
    });

    if (format === 'csv') {
      const fields = ['date', 'client', 'vehicle', 'duree', 'montantHT', 'tva', 'montantTTC', 'modePaiement', 'statut'];
      const parser = new Parser({ fields });
      const csv = parser.parse(data);
      return { format: 'csv', data: csv, filename: `rapport_${from}_${to}.csv` };
    }

    if (format === 'pdf') {
      const pdfBuffer = await this.generatePdfReport(data, from, to);
      return { format: 'pdf', data: pdfBuffer.toString('base64'), filename: `rapport_${from}_${to}.pdf` };
    }

    return { format: 'json', data };
  }

  private async generatePdfReport(data: any[], from?: string, to?: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text('Rapport des Réservations', { align: 'center' });
      if (from && to) {
        doc.fontSize(12).text(`Période: ${from} au ${to}`, { align: 'center' });
      }
      doc.moveDown(2);

      const totalHT = data.reduce((acc, r) => acc + parseFloat(r.montantHT), 0);
      const totalTVA = data.reduce((acc, r) => acc + parseFloat(r.tva), 0);
      const totalTTC = data.reduce((acc, r) => acc + parseFloat(r.montantTTC), 0);

      const tableTop = doc.y;
      let y = tableTop;

      doc.fontSize(10).text('Date', 50, y);
      doc.text('Client', 120, y);
      doc.text('Véhicule', 220, y);
      doc.text('Durée', 320, y);
      doc.text('TTC', 420, y, { align: 'right' });
      doc.text('Statut', 500, y);
      y += 20;

      data.slice(0, 30).forEach((r) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        doc.text(r.date, 50, y);
        doc.text(r.client.substring(0, 20), 120, y);
        doc.text(r.vehicle.substring(0, 20), 220, y);
        doc.text(r.duree, 320, y);
        doc.text(r.montantTTC + ' MAD', 420, y, { align: 'right' });
        doc.text(r.statut, 500, y);
        y += 15;
      });

      doc.moveDown(2);
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;

      doc.fontSize(12).text('Total HT: ' + totalHT.toFixed(2) + ' MAD', 50, y);
      doc.text('Total TVA: ' + totalTVA.toFixed(2) + ' MAD', 200, y);
      doc.text('Total TTC: ' + totalTTC.toFixed(2) + ' MAD', 380, y, { align: 'right' });

      doc.moveDown(2);
      doc.fontSize(10).text(`Généré le ${new Date().toLocaleString('fr-FR')}`, { align: 'center' });

      doc.end();
    });
  }

  async getReviews(status?: string) {
    const where: any = {};
    
    if (status === 'pending') {
      where.isPublished = false;
    } else if (status === 'published') {
      where.isPublished = true;
    }

    return this.prisma.review.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        reservation: {
          include: { vehicle: { select: { brand: true, model: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async moderateReview(id: string, action: 'publish' | 'reject') {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { user: true, reservation: { include: { vehicle: true } } },
    });

    if (!review) {
      throw new ForbiddenException('Review not found');
    }

    if (action === 'publish') {
      await this.prisma.review.update({
        where: { id },
        data: { isPublished: true },
      });

      await this.sendReviewNotification(review);
      
      return { success: true, message: 'Review published successfully' };
    } else {
      await this.prisma.review.delete({ where: { id } });
      return { success: true, message: 'Review rejected and deleted' };
    }
  }

  private async sendReviewNotification(review: any) {
    const sendgridKey = this.configService.get('SENDGRID_API_KEY');
    if (!sendgridKey) return;

    const vehicleName = `${review.reservation.vehicle.brand} ${review.reservation.vehicle.model}`;
    
    const msg = {
      to: review.user.email,
      from: this.configService.get('FROM_EMAIL') || 'noreply@carloc.ma',
      subject: 'Votre avis a été publié sur CarLoc',
      html: `
        <h2>Bonjour ${review.user.firstName},</h2>
        <p>Nous avons le plaisir de vous informer que votre avis concernant la location de <strong>${vehicleName}</strong> a été publié sur notre site.</p>
        <p>Merci pour votre retour!</p>
        <p>L'équipe CarLoc</p>
      `,
    };

    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error('SendGrid error:', error.message);
    }
  }

  async getIncidents(status?: string) {
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    return this.prisma.incident.findMany({
      where,
      include: {
        vehicle: { select: { brand: true, model: true, registrationNumber: true } },
        agent: { select: { firstName: true, lastName: true } },
        reservation: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateIncident(id: string, status?: string, adminNote?: string) {
    const incident = await this.prisma.incident.findUnique({ where: { id } });

    if (!incident) {
      throw new ForbiddenException('Incident not found');
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status.toUpperCase();
    }
    if (adminNote !== undefined) {
      updateData.adminNote = adminNote;
    }

    const updated = await this.prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: { select: { brand: true, model: true } },
        agent: { select: { firstName: true, lastName: true } },
      },
    });

    return { success: true, incident: updated };
  }
}
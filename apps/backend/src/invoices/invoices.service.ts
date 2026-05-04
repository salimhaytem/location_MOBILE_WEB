import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InvoicesService {
  private readonly s3Bucket: string;
  private readonly s3Region: string;
  private readonly s3AccessKeyId: string;
  private readonly s3SecretAccessKey: string;
  private readonly agencyName: string;
  private readonly agencyAddress: string;
  private readonly agencyPhone: string;
  private readonly agencyEmail: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.s3Bucket = this.configService.get('AWS_S3_BUCKET') || 'carloc-invoices';
    this.s3Region = this.configService.get('AWS_REGION') || 'eu-west-1';
    this.s3AccessKeyId = this.configService.get('AWS_ACCESS_KEY_ID') || '';
    this.s3SecretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY') || '';
    this.agencyName = this.configService.get('AGENCY_NAME') || 'CarLoc';
    this.agencyAddress = this.configService.get('AGENCY_ADDRESS') || '123 Rue Mohammed V, Casablanca';
    this.agencyPhone = this.configService.get('AGENCY_PHONE') || '+212 522 123 456';
    this.agencyEmail = this.configService.get('AGENCY_EMAIL') || 'contact@carloc.ma';
  }

  async generateInvoice(reservationId: string): Promise<{ pdfUrl: string; invoiceNumber: string }> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        user: { include: { profile: true } },
        vehicle: { include: { category: true } },
        checkin: true,
        checkout: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.status !== 'COMPLETED') {
      throw new NotFoundException('Invoice only available for completed reservations');
    }

    const invoiceNumber = `INV-${reservation.id.slice(0, 8).toUpperCase()}-${Date.now()}`;
    const pdfBuffer = await this.createPdfBuffer(reservation, invoiceNumber);

    const filename = `invoices/${invoiceNumber}.pdf`;
    const pdfUrl = await this.uploadToS3(pdfBuffer, filename);

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { notes: reservation.notes ? `${reservation.notes}\nFacture: ${pdfUrl}` : `Facture: ${pdfUrl}` },
    });

    return { pdfUrl, invoiceNumber };
  }

  private async createPdfBuffer(reservation: any, invoiceNumber: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const days = Math.ceil(
        (new Date(reservation.returnDate).getTime() - new Date(reservation.pickupDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const subtotal = reservation.totalPrice / 1.2;
      const tva = reservation.totalPrice - subtotal;

      doc.fontSize(24).fillColor('#0ea5e9').text(this.agencyName, { align: 'center' });
      doc.fontSize(12).fillColor('#666').text(this.agencyAddress, { align: 'center' });
      doc.text(`${this.agencyPhone} | ${this.agencyEmail}`, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(20).fillColor('#000').text('FACTURE', { align: 'center' });
      doc.fontSize(12).text(`N°: ${invoiceNumber}`, { align: 'center' });
      doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(14).fillColor('#000').text('Informations Client');
      doc.fontSize(10).fillColor('#666');
      doc.text(`Nom: ${reservation.user.firstName} ${reservation.user.lastName}`);
      doc.text(`Email: ${reservation.user.email}`);
      if (reservation.user.profile) {
        if (reservation.user.profile.address) doc.text(`Adresse: ${reservation.user.profile.address}`);
        if (reservation.user.profile.idCardNumber) doc.text(`CIN: ${reservation.user.profile.idCardNumber}`);
      }
      doc.moveDown();

      doc.fontSize(14).fillColor('#000').text('Détails de la Location');
      doc.fontSize(10).fillColor('#666');
      doc.text(`Véhicule: ${reservation.vehicle.brand} ${reservation.vehicle.model}`);
      doc.text(`Immatriculation: ${reservation.vehicle.registrationNumber}`);
      doc.text(`Catégorie: ${reservation.vehicle.category?.name}`);
      doc.moveDown();

      doc.fontSize(14).fillColor('#000').text('Dates');
      doc.fontSize(10).fillColor('#666');
      doc.text(`Prise en charge: ${new Date(reservation.pickupDate).toLocaleDateString('fr-FR')}`);
      doc.text(`Remise: ${new Date(reservation.returnDate).toLocaleDateString('fr-FR')}`);
      doc.text(`Durée: ${days} jour(s)`);
      doc.moveDown();

      doc.fontSize(14).fillColor('#000').text('Options');
      doc.fontSize(10).fillColor('#666');
      if (reservation.insurance) doc.text('✓ Assurance tous risques');
      if (reservation.gps) doc.text('✓ GPS');
      if (reservation.babySeat) doc.text('✓ Siège bébé');
      doc.moveDown();

      const tableTop = doc.y;
      doc.fontSize(12).text('Récapitulatif', 50, tableTop);
      doc.fontSize(10).fillColor('#666');
      doc.text('Sous-total (HT)', 50, tableTop + 20);
      doc.text(`${subtotal.toFixed(2)} MAD`, 350, tableTop + 20, { align: 'right' });
      doc.text('TVA (20%)', 50, tableTop + 40);
      doc.text(`${tva.toFixed(2)} MAD`, 350, tableTop + 40, { align: 'right' });
      doc.moveTo(50, tableTop + 55).lineTo(550, tableTop + 55).stroke();
      doc.fontSize(12).fillColor('#000').text('Total TTC', 50, tableTop + 70);
      doc.text(`${reservation.totalPrice.toFixed(2)} MAD`, 350, tableTop + 70, { align: 'right' });
      doc.fontSize(10).fillColor('#666').text(`Caution: ${reservation.depositAmount} MAD (restituable)`, 50, tableTop + 90);

      if (reservation.checkout?.additionalCharges) {
        doc.moveDown(2);
        doc.fillColor('#d97706').text(`Frais km supplémentaires: ${reservation.checkout.additionalCharges} MAD`);
      }

      doc.moveDown(4);
      doc.fontSize(10).fillColor('#999').text('Merci de votre confiance!', { align: 'center' });
      doc.text('Conditions générales de location disponibles sur simple demande', { align: 'center' });

      doc.end();
    });
  }

  private async uploadToS3(buffer: Buffer, filename: string): Promise<string> {
    if (!this.s3AccessKeyId || !this.s3SecretAccessKey) {
      console.log('S3 not configured, returning local mock URL');
      return `http://localhost:4000/invoices/${filename}`;
    }

    const AWS = require('aws-sdk');
    const s3 = new AWS.S3({
      accessKeyId: this.s3AccessKeyId,
      secretAccessKey: this.s3SecretAccessKey,
      region: this.s3Region,
    });

    await s3.upload({
      Bucket: this.s3Bucket,
      Key: filename,
      Body: buffer,
      ContentType: 'application/pdf',
      ACL: 'private',
    }).promise();

    const signedUrl = s3.getSignedUrl('getObject', {
      Bucket: this.s3Bucket,
      Key: filename,
      Expires: 365 * 24 * 60 * 60,
    });

    return signedUrl;
  }
}
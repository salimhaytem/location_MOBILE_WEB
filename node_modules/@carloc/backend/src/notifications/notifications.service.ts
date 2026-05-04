import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';

export enum NotificationEvent {
  RESERVATION_CREATED = 'RESERVATION_CREATED',
  CASH_CONFIRMED = 'CASH_CONFIRMED',
  CHECKIN_DONE = 'CHECKIN_DONE',
  CHECKOUT_DONE = 'CHECKOUT_DONE',
  REMINDER_J1 = 'REMINDER_J1',
}

interface EmailTemplate {
  subject: string;
  html: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly sendgridApiKey: string;
  private readonly fromEmail: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.sendgridApiKey = this.configService.get('SENDGRID_API_KEY') || '';
    this.fromEmail = this.configService.get('FROM_EMAIL') || 'noreply@carloc.fr';
  }

  private getTemplate(event: NotificationEvent, data: any): EmailTemplate {
    const templates: Record<NotificationEvent, EmailTemplate> = {
      [NotificationEvent.RESERVATION_CREATED]: {
        subject: 'Confirmation de votre réservation - CarLoc',
        html: `
          <h1>Réservation confirmée!</h1>
          <p>Bonjour ${data.userFirstName},</p>
          <p>Votre réservation a été créée avec succès.</p>
          <ul>
            <li>Véhicule: ${data.vehicleName}</li>
            <li>Dates: ${data.pickupDate} au ${data.returnDate}</li>
            <li>Total: ${data.totalPrice} MAD</li>
          </ul>
          ${data.paymentMethod === 'CASH' ? '<p><strong>Mode de paiement:</strong> Espèces en agence</p>' : ''}
        `,
      },
      [NotificationEvent.CASH_CONFIRMED]: {
        subject: 'Paiement reçu - CarLoc',
        html: `
          <h1>Paiement confirmé</h1>
          <p>Bonjour ${data.userFirstName},</p>
          <p>Nous avons reçu votre paiement de ${data.amount} MAD.</p>
          <p>Votre réservation est maintenant confirmée.</p>
        `,
      },
      [NotificationEvent.CHECKIN_DONE]: {
        subject: 'Check-in effectué - CarLoc',
        html: `
          <h1>Check-in realizado</h1>
          <p>Bonjour ${data.userFirstName},</p>
          <p>Le check-in de votre véhicule a été effectué.</p>
          <ul>
            <li>Km au départ: ${data.kmAtPickup}</li>
            <li>Carburant: ${data.fuelLevel}/4</li>
          </ul>
          <p>Passe享用 votre location!</p>
        `,
      },
      [NotificationEvent.CHECKOUT_DONE]: {
        subject: 'Check-out effectué - CarLoc',
        html: `
          <h1>Check-out realizado</h1>
          <p>Bonjour ${data.userFirstName},</p>
          <p>Merci d'avoir choisi CarLoc!</p>
          <ul>
            <li>Km au retour: ${data.kmAtReturn}</li>
            <li>Km parcourus: ${data.kmDriven}</li>
            ${data.extraKm > 0 ? `<li>Km supplémentaires: ${data.extraKm} (- ${data.additionalCharges} MAD)</li>` : ''}
          </ul>
          <p>Nous espérons vous revoir bientôt!</p>
        `,
      },
      [NotificationEvent.REMINDER_J1]: {
        subject: 'Rappel: Votre location commence demain - CarLoc',
        html: `
          <h1>Rappel</h1>
          <p>Bonjour ${data.userFirstName},</p>
          <p>Rappel: votre location commence demain!</p>
          <ul>
            <li>Véhicule: ${data.vehicleName}</li>
            <li>Date de prise en charge: ${data.pickupDate}</li>
            <li>Lieu: ${data.pickupLocation}</li>
          </ul>
          <p>À bientôt!</p>
        `,
      },
    };

    return templates[event];
  }

  async sendEmail(to: string, event: NotificationEvent, data: any) {
    const template = this.getTemplate(event, data);

    this.logger.log(`Sending email ${event} to ${to}`);

    if (this.sendgridApiKey && to.includes('@')) {
      try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(this.sendgridApiKey);

        await sgMail.send({
          to,
          from: this.fromEmail,
          subject: template.subject,
          html: template.html,
        });
        this.logger.log(`Email sent successfully to ${to}`);
      } catch (error) {
        this.logger.error(`Failed to send email: ${error.message}`);
      }
    } else {
      this.logger.warn(`SendGrid not configured or invalid email. Would have sent: ${template.subject}`);
    }
  }

  async sendReservationCreated(reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { user: true, vehicle: true },
    });

    if (reservation) {
      await this.sendEmail(reservation.user.email, NotificationEvent.RESERVATION_CREATED, {
        userFirstName: reservation.user.firstName,
        vehicleName: `${reservation.vehicle.brand} ${reservation.vehicle.model}`,
        pickupDate: new Date(reservation.pickupDate).toLocaleDateString('fr-FR'),
        returnDate: new Date(reservation.returnDate).toLocaleDateString('fr-FR'),
        totalPrice: reservation.totalPrice,
        paymentMethod: 'CASH',
      });
    }
  }

  async sendCashConfirmed(reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { user: true },
    });

    if (reservation) {
      await this.sendEmail(reservation.user.email, NotificationEvent.CASH_CONFIRMED, {
        userFirstName: reservation.user.firstName,
        amount: reservation.totalPrice,
      });
    }
  }

  async sendCheckInDone(reservationId: string, checkInData: any) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { user: true },
    });

    if (reservation) {
      await this.sendEmail(reservation.user.email, NotificationEvent.CHECKIN_DONE, {
        userFirstName: reservation.user.firstName,
        kmAtPickup: checkInData.kmAtPickup,
        fuelLevel: checkInData.fuelLevelPickup,
      });
    }
  }

  async sendCheckOutDone(reservationId: string, checkOutData: any) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { user: true },
    });

    if (reservation) {
      await this.sendEmail(reservation.user.email, NotificationEvent.CHECKOUT_DONE, {
        userFirstName: reservation.user.firstName,
        kmAtReturn: checkOutData.kmAtReturn,
        kmDriven: checkOutData.kmDriven,
        extraKm: checkOutData.extraKm,
        additionalCharges: checkOutData.additionalCharges,
      });
    }
  }

  @Cron('0 9 * * *')
  async sendReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        pickupDate: { gte: tomorrow, lte: tomorrowEnd },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      include: { user: true, vehicle: true },
    });

    for (const reservation of reservations) {
      await this.sendEmail(reservation.user.email, NotificationEvent.REMINDER_J1, {
        userFirstName: reservation.user.firstName,
        vehicleName: `${reservation.vehicle.brand} ${reservation.vehicle.model}`,
        pickupDate: new Date(reservation.pickupDate).toLocaleDateString('fr-FR'),
        pickupLocation: reservation.pickupLocation,
      });
    }
  }
}
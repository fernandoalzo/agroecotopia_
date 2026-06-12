import { PaymentsRepository } from "./payments.repository";
import { PaymentsService } from "./payments.service";

export const paymentsRepository = new PaymentsRepository();
export const paymentsService = new PaymentsService(paymentsRepository);

export * from './payments.actions';

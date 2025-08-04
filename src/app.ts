import cors from "cors";
import express, { Express } from "express";
import "reflect-metadata";
import { AuthRouter } from "./modules/auth/auth.router";
import { PORT } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { EventRouter } from "./modules/events/event.router";
import { SampleRouter } from "./modules/sample/sample.router";
import { TransactionRouter } from "./modules/transaction/transaction.router";
import { TicketRouter } from "./modules/ticket/ticket.router";
import { VoucherRouter } from "./modules/voucher/voucher.router";

export class App {
  app: Express;

  constructor() {
    this.app = express();
    this.configure();
    this.routes();
    this.handleError();
  }

  private configure() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private routes() {
    const sampleRouter = new SampleRouter();
    const eventRouter = new EventRouter();
    const authRouter = new AuthRouter();
    const transactionRouter = new TransactionRouter();
    const ticketRouter = new TicketRouter();
    const voucherRouter = new VoucherRouter();

    this.app.use("/sample", sampleRouter.getRoutes());
    this.app.use("/auth", authRouter.getRouter());
    this.app.use("/events", eventRouter.getRouter());
    this.app.use("/transactions", transactionRouter.getRouter());
    this.app.use("/tickets", ticketRouter.getRouter());
    this.app.use("/vouchers", voucherRouter.getRouter());
  }

  private handleError() {
    this.app.use(errorMiddleware);
  }

  public start() {
    this.app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  }
}

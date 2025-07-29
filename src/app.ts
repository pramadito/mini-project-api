import cors from "cors";
import express, { Express } from "express";
import { PORT } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { SampleRouter } from "./modules/sample/sample.router";
import { AuthRouter } from "./auth/auth.router";
import { EventRouter } from "./modules/events/event.router";


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

    this.app.use("/sample", sampleRouter.getRoutes());
    this.app.use("/auth", authRouter.getRouter());
    this.app.use("/events", eventRouter.getRouter());

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

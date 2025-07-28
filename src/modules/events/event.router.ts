import { Router } from "express";
import { EventController } from "./event.controller";

export class EventRouter {
  private router: Router;
  private eventController: EventController;

  constructor() {
    this.router = Router();
    this.eventController = new EventController();
    this.initializeRoutes();
  }

  private initializeRoutes = () => {
    this.router.get("/", this.eventController.getEvents);
  };

  getRouter = () => {
    return this.router;
  };
}

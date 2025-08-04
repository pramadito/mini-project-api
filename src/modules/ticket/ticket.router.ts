import { Router } from "express";
import { TicketController } from "./ticket.controller";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { validateBody } from "../../middlewares/validation.middleware";
import { CreateTicketDTO } from "./dto/create-ticket.dto";
import { UploaderMiddleware } from "../../middlewares/uploader.middleware";

const uploader = new UploaderMiddleware(); 

export class TicketRouter {
  private router: Router;
  private ticketController: TicketController;
  private jwtMiddleware: JwtMiddleware;

  constructor() {
    this.router = Router();
    this.ticketController = new TicketController();
    this.jwtMiddleware = new JwtMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes = () => {
    this.router.get("/", this.ticketController.getTickets);
    this.router.post(
      "/",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      uploader.upload().none(),
      validateBody(CreateTicketDTO),
      this.ticketController.createTicket
    );
  };

  getRouter = () => this.router;
}
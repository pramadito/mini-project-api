import { Router } from "express";
import { AuthController } from "./auth.controller";
import { Validate, validate } from "class-validator";
import { RegisterDTO } from "./dto/register.dto";
import { validateBody } from "../../middlewares/validate.middleware";
import { LoginDTO } from "./dto/login.dto";

export class AuthRouter {
  private router: Router;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.post(
      "/register",
      validateBody(RegisterDTO),
      this.authController.register
    );
    this.router.post(
      "/login",
      validateBody(LoginDTO),
      this.authController.login
    );
  };

  getRouter = () => {
    return this.router;
  };
}

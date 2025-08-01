import { Router } from "express";
import { AuthController } from "./auth.controller";
import { Validate, validate } from "class-validator";
import { RegisterDTO } from "./dto/register.dto";
import { validateBody } from "../../middlewares/validation.middleware";
import { LoginDTO } from "./dto/login.dto";
import { ForgotPasswordDTO } from "./dto/forgot-password.dto";
import { ResetPasswordDTO } from "./dto/reset-password.dto";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { UpdateUserDTO } from "./dto/update-user.dto";
import { UploaderMiddleware } from "../middlewares/uploader.middleware";

export class AuthRouter {
  private router: Router;
  private authController: AuthController;
  private jwtMiddleware: JwtMiddleware;
  private uploaderMiddleware: UploaderMiddleware;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.jwtMiddleware = new JwtMiddleware();
    this.uploaderMiddleware = new UploaderMiddleware();
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
     this.router.post(
      "/forgot-password",
      validateBody(ForgotPasswordDTO),
      this.authController.forgotPassword
    );
    this.router.patch(
      "/reset-password",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET_RESET!),
      validateBody(ResetPasswordDTO),
      this.authController.resetPassword
    );
    this.router.patch(
      "/update-user",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.uploaderMiddleware.upload().fields([{name: "profilePicture", maxCount: 1}]), // 3
      this.uploaderMiddleware.fileFilter(["image/jpeg", "image/png" , "image/avif", "image/webp"]),
      validateBody(UpdateUserDTO),
      this.authController.updateUser
    );
  };

  getRouter = () => {
    return this.router;
  };
}

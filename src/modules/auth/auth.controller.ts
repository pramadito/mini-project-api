import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { ApiError } from "../utils/api-error";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response) => {
    const result = await this.authService.register(req.body);
    res.status(200).send(result);
  };

  login = async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body);
    res.status(200).send(result);
  };

  forgotPassword = async (req: Request, res: Response) => {
    const result = await this.authService.forgotPassword(req.body);
    res.status(200).send(result);
  };
  resetPassword = async (req: Request, res: Response) => {
    const authUserId = res.locals.user.id;
    const result = await this.authService.resetPassword(req.body, authUserId);
    res.status(200).send(result);
  };
  updateUser = async (req: Request, res: Response) => {
    const authUserId = res.locals.user.id;
    const files = req.files as { [field: string]: Express.Multer.File[] };
    const profilePicture = files.profilePicture?.[0];
    const result = await this.authService.updateUser(
      req.body,
      profilePicture,
      authUserId
    );
    res.status(200).send(result);
  };
}

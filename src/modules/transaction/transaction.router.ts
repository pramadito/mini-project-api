import { Router } from "express";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { validateBody } from "../../middlewares/validation.middleware";
import { CreateTransactionDTO } from "./dto/create-transaction.dto";
import { TransactionController } from "./transaction.controller";
import { uploadPaymentProofDTO } from "./dto/upload-payment-proof.dto";
import { UploaderMiddleware } from "../../middlewares/uploader.middleware";
import { UpdateTransactionDTO } from "./dto/update-transaction.dto";

export class TransactionRouter {
  private router: Router;
  private transactionController: TransactionController;
  private jwtMiddleWare: JwtMiddleware;
  private uploaderMiddleware: UploaderMiddleware;
  constructor() {
    this.router = Router();
    this.transactionController = new TransactionController();
    this.jwtMiddleWare = new JwtMiddleware();
    this.uploaderMiddleware = new UploaderMiddleware();
    this.intializeRoutes();
  }

  private intializeRoutes = () => {
    this.router.post(
      "/",
      this.jwtMiddleWare.verifyToken(process.env.JWT_SECRET!),
      this.jwtMiddleWare.verifyRole(["CUSTOMER"]),
      validateBody(CreateTransactionDTO),
      this.transactionController.createTransaction
    );
    this.router.patch(
      "/payment-proof",
      this.jwtMiddleWare.verifyToken(process.env.JWT_SECRET!),
      this.uploaderMiddleware
        .upload()
        .fields([{ name: "paymentProof", maxCount: 1 }]),
      this.uploaderMiddleware.fileFilter([
        "image/jpeg",
        "image/png",
        "image/heic",
        "image/avif",
      ]),
      validateBody(uploadPaymentProofDTO),
      this.transactionController.uploadPaymentProof
    );

    this.router.patch(
      "/",
      this.jwtMiddleWare.verifyToken(process.env.JWT_SECRET!),
      this.jwtMiddleWare.verifyRole(["ORGANIZER"]),
      validateBody(UpdateTransactionDTO),
      this.transactionController.updateTransaction
    );
  };

  getRouter = () => {
    return this.router;
  };
}

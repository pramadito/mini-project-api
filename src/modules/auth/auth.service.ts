import { ApiError } from "../../utils/api-error";
import { JwtService } from "../jwt/jwt.service";
import { PasswordService } from "../password/password.service";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDTO } from "./dto/login.dto";
import { RegisterDTO } from "./dto/register.dto";
import { MailService } from "../mail/mail.service";
import { ForgotPasswordDTO } from "./dto/forgot-password.dto";
import { ResetPasswordDTO } from "./dto/reset-password.dto";
import { UpdateUserDTO } from "./dto/update-user.dto";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { User } from "../../generated/prisma";

export class AuthService {
  private prisma: PrismaService;
  private passwordService: PasswordService;
  private jwtService: JwtService;
  private mailService: MailService;
  private cloudinaryService: CloudinaryService;

  constructor() {
    this.prisma = new PrismaService();
    this.passwordService = new PasswordService();
    this.jwtService = new JwtService();
    this.mailService = new MailService();
    this.cloudinaryService = new CloudinaryService();
  }

  private generateReferralCode(): string {
    // Generate a random 8-character alphanumeric code
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private generateCouponCode(): string {
    // Generate a random 6-character alphanumeric code with REF prefix
    return `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  register = async (body: RegisterDTO) => {
    const userExists = await this.prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (userExists) {
      throw new ApiError("User already exists", 400);
    }

    const hashedPassword = await this.passwordService.hashPassword(
      body.password
    );

    // Generate a unique referral code for the new user
    const referralCode = this.generateReferralCode();

    // Start transaction
    return await this.prisma.$transaction(async (tx) => {
      // Create the new user
      const newUser = await tx.user.create({
        data: {
          name: body.name,
          email: body.email,
          password: hashedPassword,
          referredBy: body.referredBy || null,
          referralCode,
        },
      });

      // Calculate expiration date (3 months from now)
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);

      // Handle referral if provided
      if (body.referredBy) {
        // Find referrer by referral code
        const referrer = await tx.user.findUnique({
          where: { referralCode: body.referredBy },
        });

        if (!referrer) {
          throw new ApiError("Invalid referral code", 400);
        }

        // // Update new user's referredBy field
        // await tx.user.update({
        //   where: { id: newUser.id },
        //   data: { referredBy: referrer.referralCode },
        // });

        // Add points to reffered user
        await tx.point.create({
          data: {
            amount: 10000,
            userId: referrer.id,
            expiresAt,
            source: "REFERRAL_BONUS",
          },
        });

        // Create discount coupon for the new user (10% discount)
        await tx.coupon.create({
          data: {
            code: this.generateCouponCode(),
            discount: 10,
            userId: newUser.id,
            validFrom: new Date(),
            validUntil: expiresAt,
            source: "REFERRAL",
          },
        });
      }

      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    });
  };

  login = async (body: LoginDTO) => {
    const user = await this.prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (!user) {
      throw new ApiError("User not found", 400);
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      body.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new ApiError("Invalid password", 400);
    }

    const payload = { id: user.id, role: user.role };
    const accessToken = await this.jwtService.generateToken(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: "2h" }
    );

    const { password, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, accessToken };
  };

  forgotPassword = async (body: ForgotPasswordDTO) => {
    const user = await this.prisma.user.findFirst({
      where: { email: body.email },
    });

    if (!user) {
      throw new ApiError("Invalid email address", 400);
    }

    const payload = { id: user.id };

    const token = this.jwtService.generateToken(
      payload,
      process.env.JWT_SECRET_RESET!,
      { expiresIn: "15m" }
    );

    const resetLink = `http://localhost:3000/reset-password/${token}`;
    await this.mailService.sendMail(
      body.email,
      "Reset Password",
      "forgot-password",
      {
        name: user.name,
        resetLink: resetLink,
        expireMinutes: "15",
        year: new Date().getFullYear(),
      }
    );

    return { message: "send email successfully" };
  };

  resetPassword = async (body: ResetPasswordDTO, authUserId: number) => {
    const user = await this.prisma.user.findFirst({
      where: { id: authUserId },
    });

    if (!user) {
      throw new ApiError("User not found", 400);
    }

    const hashedPassword = await this.passwordService.hashPassword(
      body.password
    );

    await this.prisma.user.update({
      where: { id: authUserId },
      data: { password: hashedPassword },
    });

    return { message: "reset password success" };
  };

  updateUser = async (
    body: Partial<UpdateUserDTO>,
    profilePicture: Express.Multer.File,
    authUserId: number
  ) => {
    // Create update data object with only the fields that are provided
    const updateData: Partial<User> = {};

    // Only include fields that are actually provided in the body
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (profilePicture !== undefined) {
      const updatedProfilePicture = await this.cloudinaryService.upload(
        profilePicture
      );
      updateData.profilePicture = updatedProfilePicture.secure_url;
    }

    let hashedPassword: string | undefined;
    // Handle password separately
    if (body.password !== undefined) {
      hashedPassword = await this.passwordService.hashPassword(
      body.password
    );
    }

   

    const payload = { id: updateData.id };
    const accessToken = this.jwtService.generateToken(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: "2h" }
    );


    const updatedUser = await this.prisma.user.update({
      where: { id: authUserId },
      data: { ...updateData, password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,



        // Include other fields you want to return
        // Explicitly exclude password and other sensitive fields
      },
    });

    // const payload = { id: updatedUser.id };
    // const accessToken = this.jwtService.generateToken(
    //   payload,
    //   process.env.JWT_SECRET!,
    //   { expiresIn: "2h" }
    // );

    return {
      ...updatedUser,
      accessToken,
    };
    

    // const {  ...userWithoutPassword } = updatedUser;
    // return { ...userWithoutPassword, accessToken };

  };
}

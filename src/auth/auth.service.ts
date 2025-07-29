import { ApiError } from "../utils/api-error";
import { JwtService } from "../modules/jwt/jwt.service";
import { PasswordService } from "../password/password.service";
import { PrismaService } from "../modules/prisma/prisma.service";
import { LoginDTO } from "./dto/login.dto";
import { RegisterDTO } from "./dto/register.dto";

export class AuthService {
  private prisma: PrismaService;
  private passwordService: PasswordService;
  private jwtService: JwtService;
  constructor() {
    this.prisma = new PrismaService();
    this.passwordService = new PasswordService();
    this.jwtService = new JwtService();
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

      // // Generate JWT token for immediate login
      // const payload = { id: newUser.id };
      // const accessToken = await this.jwtService.generateToken(
      //   payload,
      //   process.env.JWT_SECRET_KEY!,
      //   { expiresIn: "1d" }
      // );

      // Return user without password and with access token
      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword
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

    const payload = { id: user.id };
    const accessToken = await this.jwtService.generateToken(
      payload,
      process.env.JWT_SECRET_KEY!,
      { expiresIn: "2h" }
    );

    const { password, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, accessToken };
  };
}

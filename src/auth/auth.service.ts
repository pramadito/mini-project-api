import { ApiError } from "../utils/api-error";
import { JwtService } from "../modules/jwt/jwt.service";
import { PasswordService } from "../modules/password/password.service";
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
    return await this.prisma.$transaction(async (prisma) => {
      // Create the new user
      const newUser = await prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          password: hashedPassword,
          role: body.role || 'CUSTOMER',
          referralCode,
          referredBy: body.referralCode || null,
        },
      });

      // Calculate expiration date (3 months from now)
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);

      // Add signup bonus points (5000 points)
      await prisma.point.create({
        data: {
          amount: 5000,
          userId: newUser.id,
          expiresAt,
          source: 'SIGNUP_BONUS',
        },
      });

      // Handle referral if provided
      if (body.referralCode) {
        // Find referrer by referral code
        const referrer = await prisma.user.findUnique({
          where: { referralCode: body.referralCode },
        });

        if (!referrer) {
          throw new ApiError("Invalid referral code", 400);
        }

        // Update new user's referredBy field
        await prisma.user.update({
          where: { id: newUser.id },
          data: { referredBy: referrer.referralCode },
        });

        // Add points to both users (10000 points each)
        await prisma.point.createMany({
          data: [
            {
              amount: 10000,
              userId: newUser.id,
              expiresAt,
              source: 'REFERRAL_BONUS',
            },
            {
              amount: 10000,
              userId: referrer.id,
              expiresAt,
              source: 'REFERRAL_BONUS',
            },
          ],
        });

        // Create discount coupon for the new user (10% discount)
        await prisma.coupon.create({
          data: {
            code: this.generateCouponCode(),
            discount: 10,
            userId: newUser.id,
            validFrom: new Date(),
            validUntil: expiresAt,
            source: 'REFERRAL',
          },
        });
      }

      // Generate JWT token for immediate login
      const payload = { id: newUser.id };
      const accessToken = await this.jwtService.generateToken(
        payload,
        process.env.JWT_SECRET_KEY!,
        { expiresIn: "2h" }
      );

      // Return user without password and with access token
      const { password, ...userWithoutPassword } = newUser;
      return { ...userWithoutPassword, accessToken };
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
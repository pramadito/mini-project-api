import { ApiError } from "../../utils/api-error";
import { JwtService } from "../jwt/jwt.service";
import { PasswordService } from "../password/password.service";
import { PrismaService } from "../prisma/prisma.service";
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
  register = async (body: RegisterDTO) => {
    const user = await this.prisma.user.findFirst({
      where: {
        email: body.email,
      },
    });
    if (user) {
      throw new ApiError("User already exists", 400);
    }

     const hashedPassword = await this.passwordService.hashPassword(
      body.password
    );

    return await this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
      },
      omit: { password: true },
    });
  };

  login = async (body: LoginDTO) => {
    const user = await this.prisma.user.findFirst({
      where: {
        email: body.email,
      },
    })
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

    const payload = {id: user.id}

    const accessToken = await this.jwtService.generateToken(
      payload,
      process.env.JWT_SECRET_KEY!,
      {expiresIn: "2h"}
    );
    
    const {password, ...userWithoutPassword} = user;

    return {...userWithoutPassword, accessToken};
  };
}

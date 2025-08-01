import { Prisma } from "../../generated/prisma";
import { ApiError } from "../../utils/api-error";
import { generateSlug } from "../../utils/generate-slug";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEventDTO } from "./dto/create-event.dto";
import { GetEventsDTO } from "./dto/get-events.dto";

export class EventService {
  private prisma: PrismaService;
  private cloudinaryService: CloudinaryService;
  constructor() {
    this.prisma = new PrismaService();
    this.cloudinaryService = new CloudinaryService();
  }

  getEvents = async (query: GetEventsDTO) => {
    const { take, page, sortBy, sortOrder, search, category } = query;

    const whereClause: Prisma.EventWhereInput = {};

    if (search) {
      whereClause.title = { contains: search, mode: "insensitive" };
    }

    if (category) {
      whereClause.category = category;
    }
   

    const events = await this.prisma.event.findMany({
      where: whereClause,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * take,
      take: take,
      include: { organizer: { omit: { password: true } } }, // join ke table user
    });

    const total = await this.prisma.event.count({ where: whereClause });

    return {
      data: events,
      meta: { page, take, total },
    };
  };

  getEventBySlug = async (slug: string) => {
    const event = await this.prisma.event.findFirst({
      where: { slug },
    });

    if (!event) {
      throw new ApiError("Event not found", 404);
    }

    return event;
  };

  createEvent = async (
    body: CreateEventDTO,
    thumbnail: Express.Multer.File,
    autUserId: number
  ) => {
    const event = await this.prisma.event.findFirst({
      where: { title: body.title },
    });

    if (event) {
      throw new ApiError("title already in use", 400);
    }

    const slug = generateSlug(body.title);

    const { secure_url } = await this.cloudinaryService.upload(thumbnail);

    return await this.prisma.event.create({
      data: {
        ...body,
        imageUrl: secure_url,
        organizerId: autUserId,
        slug: slug,
        availableSeats: body.totalSeats,
        totalSeats: body.totalSeats,
        category: body.category,
        location: body.location,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        description: body.description,
        title: body.title,
      },
    });
  };
}

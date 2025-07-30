import { Prisma } from "../../generated/prisma";
import { ApiError } from "../../utils/api-error";
import { PaginationQueryParams } from "../pagination/dto/pagination.dto";
import { PrismaService } from "../prisma/prisma.service";
import { GetEventsDTO } from "./dto/get-events.dto";
import { getEventDTO } from "./dto/get-event.dto";

export class EventService {
  private prisma: PrismaService;
  constructor() {
    this.prisma = new PrismaService();
  }

  getEvents = async (query: GetEventsDTO) => {
    const { take, page, sortBy, sortOrder, search } = query;

    const whereClause: Prisma.EventWhereInput = {};

    if (search) {
      whereClause.title = { contains: search, mode: "insensitive" };
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
  getEvent = async (body: getEventDTO) => {
  const article = await this.prisma.event.findFirst({
    where: {},
  });

  if(!article) {
    throw new ApiError("user no found", 404);
  }

  return article
};
}

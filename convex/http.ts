import { httpRouter } from "convex/server";
import { auth } from "./convex-auth";

const http = httpRouter();

auth.addHttpRoutes(http);

export default http;

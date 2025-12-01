import { Router, Application } from "express";
import { fileRouter } from "./files";
import { travelDataRouter } from "./travel-data";
import feedbackRouter from "./feedback";
import fileHistoryRouter from "./file-history";
import adminRouter from "./admin";
import usersRouter from "./users";

export function registerRoutes(app: Application) {
  const apiRouter = Router();

  // Mount file history routes
  apiRouter.use("/file-history", fileHistoryRouter);

  // Mount file upload routes
  apiRouter.use("/files", fileRouter);

  // Mount travel data routes
  apiRouter.use("/travel-data", travelDataRouter);

  // Health check route
  apiRouter.get("/health", (req, res) => res.json({ status: "ok" }));

  // Mount admin routes
  apiRouter.use("/admin", adminRouter);

  // Mount users routes (includes announcements endpoints)
  apiRouter.use("/users", usersRouter);

  // Mount feedback routes
  apiRouter.use("/feedback", feedbackRouter);

  // Mount all routes under /api
  app.use("/api", apiRouter);

  // Log registered routes in development
  if (process.env.NODE_ENV !== "production") {
    const routes: string[] = [];
    apiRouter.stack.forEach((r: any) => {
      if (r.route) {
        routes.push(`${r.route.stack[0].method} /api${r.route.path}`);
      } else if (r.name === "router") {
        const basePath = r.regexp.source.replace("\\/?(?=\\/|$)", "");
        r.handle.stack.forEach((sr: any) => {
          if (sr.route) {
            const method = sr.route.stack[0].method;
            const path = sr.route.path === "/" ? "" : sr.route.path;
            routes.push(`${method} /api${basePath}${path}`);
          }
        });
      }
    });
    console.debug("Registered API routes:", routes);
  }

  return apiRouter;
}

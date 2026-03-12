import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import axios from "axios";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cookieParser());
  app.use(express.json({ limit: '50mb' }));

  // API routes
  app.get("/api/projects", (req, res) => {
    console.log("GET /api/projects requested");
    try {
      const projectsPath = path.resolve(process.cwd(), "projects.json");
      console.log("Reading projects from:", projectsPath);
      if (!fs.existsSync(projectsPath)) {
        console.error("projects.json not found at:", projectsPath);
        return res.status(404).json({ error: "projects.json not found" });
      }
      const data = fs.readFileSync(projectsPath, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      console.error("Failed to load projects:", error);
      res.status(500).json({ error: "Failed to load projects" });
    }
  });

  app.post("/api/projects", (req, res) => {
    console.log("POST /api/projects received");
    try {
      const updatedProjects = req.body;
      const projectsPath = path.resolve(process.cwd(), "projects.json");
      fs.writeFileSync(projectsPath, JSON.stringify(updatedProjects, null, 2));
      console.log("Successfully saved projects to:", projectsPath);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to save projects:", error);
      res.status(500).json({ error: "Failed to save projects" });
    }
  });

  app.get("/api/profile", (req, res) => {
    try {
      const profilePath = path.resolve(process.cwd(), "profile.json");
      if (!fs.existsSync(profilePath)) {
        return res.json({ name: "eveyul", intro: "Interactive Designer & Developer" });
      }
      const data = fs.readFileSync(profilePath, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      console.error("Failed to load profile:", error);
      res.status(500).json({ error: "Failed to load profile" });
    }
  });

  app.post("/api/profile", (req, res) => {
    try {
      const profileData = req.body;
      const profilePath = path.resolve(process.cwd(), "profile.json");
      fs.writeFileSync(profilePath, JSON.stringify(profileData, null, 2));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to save profile:", error);
      res.status(500).json({ error: "Failed to save profile" });
    }
  });

  // Naver OAuth Routes
  app.get("/api/auth/naver/url", (req, res) => {
    const clientId = process.env.NAVER_CLIENT_ID;
    const redirectUri = process.env.NAVER_REDIRECT_URI || `${process.env.APP_URL}/api/auth/naver/callback`;
    const state = Math.random().toString(36).substring(7);
    
    const url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    res.json({ url });
  });

  app.get("/api/auth/naver/callback", async (req, res) => {
    const { code, state } = req.query;
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    try {
      const response = await axios.get(`https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&state=${state}`);
      
      const { access_token } = response.data;
      
      // Store token in a secure, sameSite=none cookie for iframe compatibility
      res.cookie("naver_access_token", access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 3600000 // 1 hour
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'NAVER_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Naver authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Naver OAuth error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.post("/api/naver/post", async (req, res) => {
    const accessToken = req.cookies.naver_access_token;
    if (!accessToken) {
      return res.status(401).json({ error: "Not authenticated with Naver" });
    }

    const { title, contents } = req.body;

    try {
      // Naver Blog Writing API
      // Note: This requires the "Blog Writing" permission in Naver Developer Console
      const response = await axios.post("https://openapi.naver.com/blog/writePost.json", 
        new URLSearchParams({
          title,
          contents
        }).toString(),
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded"
          }
        }
      );

      res.json(response.data);
    } catch (error: any) {
      console.error("Naver Blog Post error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to post to Naver Blog", details: error.response?.data });
    }
  });

  app.get("/api/auth/naver/status", (req, res) => {
    res.json({ authenticated: !!req.cookies.naver_access_token });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

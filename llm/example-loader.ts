import fs from "fs";
import path from "path";

const EXAMPLES_DIR = path.join(process.cwd(), "features", "examples");

export function getProgrammingExamples() {
  if (!fs.existsSync(EXAMPLES_DIR)) {
    return "";
  }

  const categoryDirs = fs.readdirSync(EXAMPLES_DIR);
  let examplesOutput = "";

  for (const category of categoryDirs) {
    const categoryPath = path.join(EXAMPLES_DIR, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const projectDirs = fs.readdirSync(categoryPath);
    for (const project of projectDirs) {
      const projectPath = path.join(categoryPath, project);
      if (!fs.statSync(projectPath).isDirectory()) continue;

      const example = generateExampleForProject(category, project, projectPath);
      if (example) {
        examplesOutput += example + "\n\n";
      }
    }
  }

  return examplesOutput;
}

function generateExampleForProject(category: string, projectName: string, projectPath: string) {
  const files: { path: string; content: string }[] = [];

  // Try to find package.json
  const packageJsonPath = path.join(projectPath, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    files.push({
      path: "package.json",
      content: fs.readFileSync(packageJsonPath, "utf-8"),
    });
  }

  // Look for main files based on category
  if (category === "nextjs-examples") {
    const pagePath = path.join(projectPath, "app", "page.tsx");
    if (fs.existsSync(pagePath)) {
      files.push({
        path: "app/page.tsx",
        content: fs.readFileSync(pagePath, "utf-8"),
      });
    }
    const layoutPath = path.join(projectPath, "app", "layout.tsx");
    if (fs.existsSync(layoutPath)) {
      files.push({
        path: "app/layout.tsx",
        content: fs.readFileSync(layoutPath, "utf-8"),
      });
    }
  } else if (category === "react-examples") {
    const appPath = path.join(projectPath, "src", "App.tsx") || path.join(projectPath, "src", "App.jsx");
    if (fs.existsSync(appPath)) {
      files.push({
        path: "src/App.tsx",
        content: fs.readFileSync(appPath, "utf-8"),
      });
    }
  } else if (category === "express-examples") {
    const indexPath = path.join(projectPath, "src", "index.js") || path.join(projectPath, "index.js");
    if (fs.existsSync(indexPath)) {
      files.push({
        path: "index.js",
        content: fs.readFileSync(indexPath, "utf-8"),
      });
    }
  } else if (category === "expo-examples") {
    const layoutPath = path.join(projectPath, "app", "_layout.tsx");
    if (fs.existsSync(layoutPath)) {
      files.push({
        path: "app/_layout.tsx",
        content: fs.readFileSync(layoutPath, "utf-8"),
      });
    }
    const indexPath = path.join(projectPath, "app", "index.tsx");
    if (fs.existsSync(indexPath)) {
      files.push({
        path: "app/index.tsx",
        content: fs.readFileSync(indexPath, "utf-8"),
      });
    }
  }

  if (files.length === 0) return null;

  const title = projectName.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const userQuery = `Build a ${category.split("-")[0]} application for ${title}`;
  const id = projectName.toLowerCase();
  
  let actions = "";
  for (const file of files) {
    // Sanitize content: remove personal/sensitive repo links or replace with generic ones
    let sanitizedContent = file.content
      .replace(/https:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9._-]+/g, "https://github.com/example/repo")
      .replace(/`/g, "\\`")
      .replace(/\${/g, "\\${");

    actions += `      <vibeAction type="file" filePath="${file.path}">\n${sanitizedContent}\n      </vibeAction>\n`;
  }

  return `  <!-- NOTE: This is an reference example for ARCHITECTURAL INSPIRATION. Do not copy it verbatim. -->
  <example>
    <user_query>${userQuery}</user_query>
    <assistant_response>
      I'm creating a ${title} with these awesome features:
      
      ### Key Features:
      - **Inspiration-Driven Architecture** following the patterns in this example
      - **Premium Aesthetic** adapted to the specific user request
      - **Unique Implementation** that avoids verbatim copying
      
      <vibeArtifact id="${id}" title="${title}" activeRoute="/">
${actions}      </vibeArtifact>

      **Your ${title} has been successfully created!** Built with ${category.split("-")[0].toUpperCase()}, it's ready to launch.
    </assistant_response>
  </example>`;
}

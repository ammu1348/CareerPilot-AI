// Canonical Job Roles and Required Skills Dataset
export const JOB_ROLES = {
  "Data Analyst": {
    skills: ["Python", "SQL", "Excel", "Power BI", "Statistics", "Data Analytics"],
    description: "Transforms data into actionable business intelligence, dashboards, and analytical reports."
  },
  "AI/ML Engineer": {
    skills: ["Python", "Machine Learning", "Statistics", "Deep Learning", "SQL", "Git"],
    description: "Designs, trains, and deploys scalable machine learning and deep learning models."
  },
  "Software Engineer": {
    skills: ["Programming", "Data Structures", "Algorithms", "OOP", "Git", "Database"],
    description: "Architects robust software systems using sound algorithmic principles and design patterns."
  },
  "Web Developer": {
    skills: ["HTML", "CSS", "JavaScript", "React", "Git", "REST API"],
    description: "Develops responsive client-side and server-connected modern web applications."
  },
  "Java Developer": {
    skills: ["Java", "Spring Boot", "SQL", "OOP", "Git", "REST API"],
    description: "Builds high-throughput backend enterprise applications and microservices using Java."
  },
  "Python Developer": {
    skills: ["Python", "Django", "FastAPI", "SQL", "Git", "REST API"],
    description: "Develops modular web applications, APIs, and automated data workflows with Python."
  },
  "Data Scientist": {
    skills: ["Python", "Machine Learning", "Statistics", "SQL", "Data Analytics", "Deep Learning"],
    description: "Discovers patterns and develops predictive models from complex structured and unstructured data."
  },
  "Frontend Developer": {
    skills: ["HTML", "CSS", "JavaScript", "React", "Git", "Responsive Design"],
    description: "Specializes in crafting intuitive, accessible, and high-performance user interfaces."
  },
  "Backend Developer": {
    skills: ["Python", "Node.js", "SQL", "REST API", "Git", "Database"],
    description: "Engineers scalable database schemas, business logic, authentication, and REST APIs."
  },
  "Full Stack Developer": {
    skills: ["JavaScript", "React", "Node.js", "HTML", "CSS", "SQL", "Git", "REST API"],
    description: "Oversees complete software delivery across both client interfaces and server infrastructure."
  }
};

// Skill Normalization Mapping (lowercase alias -> canonical skill name)
export const SKILL_NORMALIZATION_MAP = {
  "ml": "Machine Learning",
  "machine learning": "Machine Learning",
  "machine-learning": "Machine Learning",
  "dl": "Deep Learning",
  "deep learning": "Deep Learning",
  "deep-learning": "Deep Learning",
  "nlp": "NLP",
  "natural language processing": "NLP",
  "js": "JavaScript",
  "javascript": "JavaScript",
  "ecmascript": "JavaScript",
  "react": "React",
  "reactjs": "React",
  "react.js": "React",
  "react js": "React",
  "node": "Node.js",
  "nodejs": "Node.js",
  "node.js": "Node.js",
  "node js": "Node.js",
  "py": "Python",
  "python": "Python",
  "python3": "Python",
  "stats": "Statistics",
  "statistics": "Statistics",
  "statistical analysis": "Statistics",
  "probability": "Statistics",
  "power bi": "Power BI",
  "powerbi": "Power BI",
  "power-bi": "Power BI",
  "excel": "Excel",
  "ms excel": "Excel",
  "microsoft excel": "Excel",
  "sql": "SQL",
  "mysql": "SQL",
  "postgresql": "SQL",
  "postgres": "SQL",
  "sqlite": "SQL",
  "database": "Database",
  "dbms": "Database",
  "rdbms": "Database",
  "mongodb": "Database",
  "git": "Git",
  "github": "Git",
  "gitlab": "Git",
  "version control": "Git",
  "html": "HTML",
  "html5": "HTML",
  "css": "CSS",
  "css3": "CSS",
  "tailwind": "CSS",
  "bootstrap": "CSS",
  "java": "Java",
  "core java": "Java",
  "spring": "Spring Boot",
  "spring boot": "Spring Boot",
  "springboot": "Spring Boot",
  "django": "Django",
  "fastapi": "FastAPI",
  "rest": "REST API",
  "rest api": "REST API",
  "restful": "REST API",
  "restful api": "REST API",
  "rest apis": "REST API",
  "api": "REST API",
  "data structures": "Data Structures",
  "dsa": "Data Structures",
  "data structures & algorithms": "Data Structures",
  "algorithms": "Algorithms",
  "algo": "Algorithms",
  "oop": "OOP",
  "oops": "OOP",
  "object oriented programming": "OOP",
  "programming": "Programming",
  "coding": "Programming",
  "software development": "Programming",
  "problem solving": "Programming",
  "data analytics": "Data Analytics",
  "data analysis": "Data Analytics",
  "eda": "Data Analytics",
  "pandas": "Data Analytics",
  "numpy": "Data Analytics",
  "responsive design": "Responsive Design",
  "responsive": "Responsive Design",
  "web development": "HTML"
};

// Skill Recommendations Dataset
export const SKILL_RECOMMENDATIONS = {
  "Python": "Strengthen Python core fundamentals (OOP, list comprehensions, data structures, and standard libraries).",
  "SQL": "Practice complex SQL queries (multi-table joins, subqueries, CTEs, and window functions).",
  "Excel": "Learn Excel for data analysis (Pivot Tables, VLOOKUP/XLOOKUP, and conditional data modeling).",
  "Power BI": "Learn Power BI for dashboard creation, DAX calculations, and interactive business intelligence reporting.",
  "Statistics": "Strengthen statistics fundamentals (hypothesis testing, probability distributions, variance, and regression analysis).",
  "Data Analytics": "Master exploratory data analysis (EDA), data cleaning techniques, and visualization with Pandas and Seaborn.",
  "Machine Learning": "Study core ML algorithms (supervised & unsupervised learning, scikit-learn pipeline building, and model evaluation metrics).",
  "Deep Learning": "Explore neural network architectures (CNNs, RNNs, Transformers) using PyTorch or TensorFlow.",
  "Git": "Learn Git version control workflow (branching, rebasing, merge conflict resolution, and pull request collaboration).",
  "Programming": "Practice core problem solving and code modularity across fundamental computer science paradigms.",
  "Data Structures": "Practice essential data structures (arrays, linked lists, trees, graphs, heaps, and hash maps) on LeetCode.",
  "Algorithms": "Master algorithmic problem solving (sorting, binary search, recursion, dynamic programming, and greedy algorithms).",
  "OOP": "Deepen understanding of Object-Oriented Programming (encapsulation, inheritance, polymorphism, and abstraction design patterns).",
  "Database": "Learn relational and NoSQL database architecture, schema design, normalization, and indexing strategies.",
  "HTML": "Master semantic HTML5 markup, modern web accessibility (a11y/WCAG), and search engine optimization basics.",
  "CSS": "Level up modern CSS design skills (Flexbox, CSS Grid, animations, and Tailwind CSS utility styling).",
  "JavaScript": "Strengthen modern JavaScript concepts (ES6+, closures, promises, async/await, event loop, and DOM manipulation).",
  "React": "Build interactive single-page applications using React (functional components, Hooks, state management, and component lifecycle).",
  "REST API": "Learn RESTful API architecture principles, HTTP methods, status codes, JWT authentication, and API documentation.",
  "Spring Boot": "Learn Spring Boot framework for enterprise Java backend development, dependency injection, and microservices.",
  "Django": "Learn Django framework for rapid Python web development, ORM querying, and secure user authentication.",
  "FastAPI": "Build high-speed asynchronous REST APIs in Python using FastAPI, Pydantic data schemas, and OpenAPI.",
  "Node.js": "Develop scalable server-side applications using Node.js, Express.js middleware, and asynchronous I/O.",
  "Responsive Design": "Learn mobile-first responsive web design principles, flexible layouts, and CSS media queries.",
  "Java": "Master core Java principles (Java Collections Framework, multithreading, concurrency, and JVM internals)."
};

/**
 * Normalizes raw skill strings or aliases into canonical names.
 */
export function normalizeSkills(skills = []) {
  const normalizedSet = new Set();

  skills.forEach((raw) => {
    if (!raw) return;
    const clean = raw.trim().toLowerCase();
    const canonical = SKILL_NORMALIZATION_MAP[clean] || raw.trim();
    normalizedSet.add(canonical);

    // Expand composite terms
    if (["dsa", "data structures and algorithms", "data structures & algorithms"].includes(clean)) {
      normalizedSet.add("Data Structures");
      normalizedSet.add("Algorithms");
    }
    if (["sql", "mysql", "postgresql", "postgres", "mongodb"].includes(clean)) {
      normalizedSet.add("Database");
      if (clean !== "mongodb") normalizedSet.add("SQL");
    }
    if (["python", "java", "javascript", "c++", "c"].includes(clean)) {
      normalizedSet.add("Programming");
    }
  });

  return Array.from(normalizedSet);
}

/**
 * Performs deterministic skill gap calculation between extracted resume skills and target role.
 * Formula: (matched required skills / total required skills) * 100
 */
export function calculateSkillGap(resumeSkills = [], targetRole = "Data Analyst") {
  const roleConfig = JOB_ROLES[targetRole] || JOB_ROLES["Data Analyst"];
  const requiredSkills = roleConfig.skills;
  const normalizedResume = normalizeSkills(resumeSkills);

  const matchedSkills = requiredSkills.filter((req) => normalizedResume.includes(req));
  const missingSkills = requiredSkills.filter((req) => !normalizedResume.includes(req));

  const totalRequired = requiredSkills.length;
  let matchPercentage = totalRequired > 0 ? (matchedSkills.length / totalRequired) * 100 : 0;
  // Round to 1 decimal place or whole number
  matchPercentage = Math.round(matchPercentage * 10) / 10;
  if (matchPercentage % 1 === 0) {
    matchPercentage = Math.round(matchPercentage);
  }

  const recommendations = missingSkills.map((skill) => {
    return SKILL_RECOMMENDATIONS[skill] || `Learn and build hands-on practical projects with ${skill}.`;
  });

  if (recommendations.length === 0) {
    recommendations.push(
      `Outstanding match for ${targetRole}! Focus on system design, end-to-end portfolio projects, and interview preparation.`
    );
  }

  return {
    targetRole,
    requiredSkills,
    matchedSkills,
    missingSkills,
    matchPercentage,
    recommendations,
    normalizedResumeSkills: normalizedResume
  };
}

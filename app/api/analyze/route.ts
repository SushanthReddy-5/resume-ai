import { NextResponse } from "next/server";
import PDFParser from "pdf2json";
import mammoth from "mammoth";
import ollama from "ollama";

export const runtime = "nodejs";

type SkillDefinition = {
  name: string;
  aliases: string[];
  preferred?: boolean;
};

const SKILLS: SkillDefinition[] = [
  {
    name: "Networking",
    aliases: ["networking", "computer networks", "network security"],
  },
  {
    name: "TCP/IP",
    aliases: ["tcp/ip", "tcp ip", "tcpip"],
  },
  {
    name: "Linux",
    aliases: ["linux", "linux fundamentals"],
  },
  {
    name: "Python",
    aliases: ["python", "python programming"],
  },
  {
    name: "Scripting",
    aliases: ["scripting", "bash", "shell scripting", "automation"],
  },
  {
    name: "Ethical Hacking",
    aliases: [
      "ethical hacking",
      "ethical hacker",
      "penetration testing",
      "pentesting",
    ],
  },
  {
    name: "Vulnerability Assessment",
    aliases: [
      "vulnerability assessment",
      "vulnerability scanning",
      "vulnerability scanner",
    ],
  },
  {
    name: "Web Security",
    aliases: [
      "web security",
      "web application security",
      "application security",
    ],
  },
  {
    name: "Cloud Security",
    aliases: [
      "cloud security",
      "cloudsecurity",
      "cloud cybersecurity",
    ],
  },
  {
    name: "SIEM",
    aliases: [
      "siem",
      "security information and event management",
    ],
  },
  {
    name: "Wireshark",
    aliases: ["wireshark"],
  },
  {
    name: "Nmap",
    aliases: ["nmap", "network mapper"],
  },
  {
    name: "Burp Suite",
    aliases: ["burp suite", "burpsuite"],
  },
  {
    name: "Metasploit",
    aliases: ["metasploit", "metasploit framework"],
  },
  {
    name: "OWASP",
    aliases: ["owasp", "owasp top 10"],
  },
  {
    name: "Cryptography",
    aliases: [
      "cryptography",
      "cryptographic",
      "encryption",
    ],
  },
  {
    name: "Analytical Skills",
    aliases: [
      "analytical skills",
      "analytical",
      "problem solving",
      "problem-solving",
    ],
  },
  {
    name: "Communication",
    aliases: [
      "communication skills",
      "communication",
      "verbal communication",
    ],
  },
  {
    name: "CEH",
    aliases: ["ceh", "certified ethical hacker"],
    preferred: true,
  },
];

const RESPONSIBILITIES = [
  {
    name: "Security Monitoring",
    aliases: [
      "security monitoring",
      "monitor security events",
      "monitoring security events",
    ],
  },
  {
    name: "Threat Detection",
    aliases: [
      "threat detection",
      "threat analysis",
      "detect threats",
    ],
  },
  {
    name: "Incident Response",
    aliases: [
      "incident response",
      "incident handling",
      "incident investigation",
    ],
  },
  {
    name: "Security Analysis",
    aliases: [
      "security analysis",
      "analyze security",
      "security analyst",
    ],
  },
  {
    name: "Security Reporting",
    aliases: [
      "security reporting",
      "security reports",
      "security documentation",
    ],
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(text: string): string {
  return normalize(text).replace(/[^a-z0-9]/g, "");
}

function flexibleMatch(
  text: string,
  aliases: string[]
): boolean {
  const normalizedText = normalize(text);
  const compactText = compact(text);

  return aliases.some((alias) => {
    const normalizedAlias = normalize(alias);
    const compactAlias = compact(alias);

    return (
      normalizedText.includes(normalizedAlias) ||
      compactText.includes(compactAlias)
    );
  });
}

function anyMatch(
  text: string,
  values: string[]
): boolean {
  return values.some((value) =>
    flexibleMatch(text, [value])
  );
}

function hasCertificationEvidence(
  text: string,
  skill: string
): boolean {
  const c = compact(text);

  if (skill === "Cloud Security") {
    return (
      c.includes("cloudsecurity") ||
      c.includes("cloudcybersecurity") ||
      c.includes("cloudsecurityfundamentals") ||
      c.includes("ibmskillsbuildcloudsecurity")
    );
  }

  if (skill === "CEH") {
    return (
      c.includes("ceh") ||
      c.includes("certifiedethicalhacker")
    );
  }

  return false;
}

function hasPracticalContext(
  text: string,
  skill: SkillDefinition
): boolean {
  const lower = normalize(text);

  const projectWords = [
    "project",
    "projects",
    "built",
    "developed",
    "implemented",
    "created",
    "hands-on",
    "hands on",
    "experience",
    "used",
    "using",
    "worked",
    "internship",
    "ctf",
    "capture the flag",
    "scanner",
    "scanning",
  ];

  if (skill.name === "Python") {
    return (
      lower.includes("python") &&
      anyMatch(lower, projectWords)
    );
  }

  return anyMatch(lower, projectWords);
}

function evidenceStrength(
  resumeText: string,
  skill: SkillDefinition
): number {
  if (hasCertificationEvidence(resumeText, skill.name)) {
    return 0.85;
  }

  if (!flexibleMatch(resumeText, skill.aliases)) {
    if (
      skill.name === "Vulnerability Assessment" &&
      anyMatch(resumeText, [
        "vulnerability scanner",
        "vulnerability scanning",
        "openvas",
        "nikto",
        "gobuster",
        "nmap",
      ])
    ) {
      return 0.7;
    }

    if (
      skill.name === "Ethical Hacking" &&
      anyMatch(resumeText, [
        "ctf",
        "capture the flag",
        "penetration testing",
        "pentest",
        "security testing",
      ])
    ) {
      return 0.7;
    }

    if (
      skill.name === "Scripting" &&
      anyMatch(resumeText, [
        "python",
        "bash",
        "shell",
        "automation",
      ])
    ) {
      return 0.65;
    }

    if (
      skill.name === "Networking" &&
      flexibleMatch(resumeText, [
        "tcp/ip",
        "tcp ip",
        "tcpip",
      ])
    ) {
      return 0.7;
    }

    return 0;
  }

  if (hasPracticalContext(resumeText, skill)) {
    return 1;
  }

  return 0.75;
}

function createAccurateSummary(
  resumeText: string,
  matchingSkills: string[]
): string {
  const parts: string[] = [];

  if (matchingSkills.includes("CEH")) {
    parts.push("Certified Ethical Hacker (CEH)");
  } else {
    parts.push("Cybersecurity enthusiast");
  }

  const technicalSkills = matchingSkills.filter(
    (skill) =>
      ![
        "CEH",
        "Communication",
        "Analytical Skills",
      ].includes(skill)
  );

  if (technicalSkills.length > 0) {
    parts.push(
      `with knowledge of ${technicalSkills
        .slice(0, 5)
        .join(", ")}`
    );
  }

  if (
    anyMatch(resumeText, [
      "project",
      "projects",
      "vulnerability scanner",
      "web security",
      "ctf",
      "capture the flag",
    ])
  ) {
    parts.push(
      "with hands-on exposure through cybersecurity projects"
    );
  }

  if (matchingSkills.includes("Analytical Skills")) {
    parts.push(
      "and analytical problem-solving skills"
    );
  }

  return parts.join(" ") + ".";
}

async function improveSummaryWithAI(
  resumeText: string,
  summary: string
): Promise<string> {
  try {
    const prompt = `
You are improving a cybersecurity resume summary.

IMPORTANT RULES:
- Do NOT invent skills.
- Do NOT invent certifications.
- Do NOT invent jobs or internships.
- Do NOT invent achievements.
- Do NOT claim experience that is not supported by the resume.
- Keep the meaning truthful.
- Make it professional and ATS-friendly.
- Keep it between 45 and 70 words.
- Return ONLY the summary.

Resume:
${resumeText.slice(0, 12000)}

Current summary:
${summary}
`;

    const response = await ollama.chat({
      model: "qwen2.5:7b",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const improved =
      response.message?.content?.trim();

    if (!improved) {
      return summary;
    }

    return improved
      .replace(/^["']|["']$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return summary;
  }
}

function calculateScore(
  resumeText: string,
  jdText: string
) {
  const matchingSkills: string[] = [];
  const missingSkills: string[] = [];

  let totalWeight = 0;
  let earnedWeight = 0;

  for (const skill of SKILLS) {
    if (!flexibleMatch(jdText, skill.aliases)) {
      continue;
    }

    const weight = skill.preferred ? 0.5 : 1;

    totalWeight += weight;

    const evidence = evidenceStrength(
      resumeText,
      skill
    );

    if (evidence > 0) {
      matchingSkills.push(skill.name);
      earnedWeight += weight * evidence;
    } else {
      missingSkills.push(skill.name);
    }
  }

  let responsibilityWeight = 0;
  let responsibilityEarned = 0;

  const matchedResponsibilities: string[] = [];

  for (const responsibility of RESPONSIBILITIES) {
    if (
      !flexibleMatch(
        jdText,
        responsibility.aliases
      )
    ) {
      continue;
    }

    const weight = 0.8;

    responsibilityWeight += weight;

    if (
      flexibleMatch(
        resumeText,
        responsibility.aliases
      )
    ) {
      matchedResponsibilities.push(
        responsibility.name
      );

      responsibilityEarned += weight;
    }
  }

  const combinedTotal =
    totalWeight + responsibilityWeight;

  const combinedEarned =
    earnedWeight + responsibilityEarned;

  let score =
    combinedTotal > 0
      ? (combinedEarned / combinedTotal) * 100
      : 0;

  score = Math.max(
    0,
    Math.min(100, score)
  );

  const importantKeywords = [
    ...SKILLS
      .filter((skill) =>
        flexibleMatch(
          jdText,
          skill.aliases
        )
      )
      .map((skill) => skill.name),

    ...RESPONSIBILITIES
      .filter((item) =>
        flexibleMatch(
          jdText,
          item.aliases
        )
      )
      .map((item) => item.name),
  ];

  return {
    score: Math.round(score),

    matchingSkills,

    missingSkills,

    importantKeywords: [
      ...new Set(importantKeywords),
    ],

    responsibilities:
      matchedResponsibilities,
  };
}

async function createTailoredResume(
  resumeText: string,
  jdText: string,
  matchingSkills: string[],
  missingSkills: string[]
): Promise<string> {
  const fallbackSummary =
    createAccurateSummary(
      resumeText,
      matchingSkills
    );

  const improvedSummary =
    await improveSummaryWithAI(
      resumeText,
      fallbackSummary
    );

  try {
    const prompt = `
Create an ATS-friendly tailored cybersecurity resume using ONLY information supported by the original resume.

STRICT RULES:
1. Never invent experience.
2. Never invent companies.
3. Never invent internships.
4. Never invent certifications.
5. Never invent projects.
6. Never add a technology unless it appears in the original resume.
7. Do not claim hands-on experience with a missing skill.
8. You may improve wording and reorder existing information.
9. Use keywords from the JD only when the resume actually supports them.
10. Keep all factual information truthful.
11. Do not add fake metrics.
12. Do not add fake achievements.
13. Preserve the candidate's actual education, projects, skills and certifications.

JOB DESCRIPTION:
${jdText.slice(0, 10000)}

ORIGINAL RESUME:
${resumeText.slice(0, 15000)}

MATCHING SKILLS:
${matchingSkills.join(", ") || "None"}

MISSING SKILLS:
${missingSkills.join(", ") || "None"}

Write the resume in this structure:

PROFESSIONAL SUMMARY
${improvedSummary}

SKILLS
Only supported skills from the original resume.

PROJECTS
Rewrite existing projects to emphasize relevant JD keywords only when truthful.

CERTIFICATIONS
Only certifications appearing in the original resume.

EDUCATION
Only education appearing in the original resume.

Return ONLY the resume content.
`;

    const response = await ollama.chat({
      model: "qwen2.5:7b",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const aiResume =
      response.message?.content?.trim();

    if (!aiResume) {
      return `
PROFESSIONAL SUMMARY

${improvedSummary}

SKILLS

${matchingSkills.join(", ")}

CERTIFICATIONS

${
  matchingSkills.includes("CEH")
    ? "Certified Ethical Hacker (CEH)"
    : ""
}
`.trim();
    }

    return aiResume
      .replace(/```/g, "")
      .replace(/\r/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch {
    return `
PROFESSIONAL SUMMARY

${improvedSummary}

SKILLS

${matchingSkills.join(", ")}

CERTIFICATIONS

${
  matchingSkills.includes("CEH")
    ? "Certified Ethical Hacker (CEH)"
    : ""
}
`.trim();
  }
}

function extractPDF(
  buffer: Buffer
): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();

    parser.on(
      "pdfParser_dataError",
      (error: any) => {
        reject(
          error?.parserError || error
        );
      }
    );

    parser.on(
      "pdfParser_dataReady",
      (pdfData: any) => {
        try {
          let text = "";

          const pages =
            pdfData?.Pages || [];

          for (const page of pages) {
            const texts =
              page?.Texts || [];

            for (const item of texts) {
              if (!item?.R) continue;

              for (const run of item.R) {
                if (!run?.T) continue;

                try {
                  text +=
                    decodeURIComponent(
                      run.T
                    ) + " ";
                } catch {
                  text +=
                    run.T + " ";
                }
              }
            }

            text += "\n";
          }

          resolve(text);
        } catch (error) {
          reject(error);
        }
      }
    );

    try {
      parser.parseBuffer(buffer);
    } catch (error) {
      reject(error);
    }
  });
}

async function extractResumeText(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  if (
    fileType === "application/pdf" ||
    fileType === "pdf"
  ) {
    return extractPDF(buffer);
  }

  if (
    fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "docx"
  ) {
    const result =
      await mammoth.extractRawText({
        buffer,
      });

    return result.value;
  }

  return buffer.toString("utf8");
}

export async function POST(
  request: Request
) {
  try {
    const formData =
      await request.formData();

    const resume =
      formData.get("resume");

    // Accept BOTH names so frontend/backend
    // cannot mismatch again.
    const jdValue =
      formData.get("jobDescription") ??
      formData.get("jd");

    if (!(resume instanceof File)) {
      return NextResponse.json(
        {
          error:
            "Resume file is required.",
        },
        { status: 400 }
      );
    }

    if (
      typeof jdValue !== "string" ||
      !jdValue.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Job description is needed.",
        },
        { status: 400 }
      );
    }

    const jd = jdValue.trim();

    const buffer = Buffer.from(
      await resume.arrayBuffer()
    );

    const fileType =
      resume.type ||
      (resume.name
        .toLowerCase()
        .endsWith(".pdf")
        ? "pdf"
        : resume.name
            .toLowerCase()
            .endsWith(".docx")
        ? "docx"
        : "txt");

    const resumeTextRaw =
      await extractResumeText(
        buffer,
        fileType
      );

    const resumeText =
      normalize(resumeTextRaw);

    const jdText = normalize(jd);

    if (!resumeText) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from the resume.",
        },
        { status: 400 }
      );
    }

    const analysis =
      calculateScore(
        resumeText,
        jdText
      );

    const tailoredResume =
      await createTailoredResume(
        resumeText,
        jdText,
        analysis.matchingSkills,
        analysis.missingSkills
      );

    return NextResponse.json({
      atsScore: analysis.score,

      matchingSkills:
        analysis.matchingSkills,

      missingSkills:
        analysis.missingSkills,

      importantKeywords:
        analysis.importantKeywords,

      responsibilities:
        analysis.responsibilities,

      tailoredResume,

      metadata: {
        scoring:
          "deterministic evidence-based",

        scoreStable: true,

        aiUsedFor:
          "truthful wording improvement only",
      },
    });
  } catch (error: any) {
    console.error(
      "ANALYZE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Something went wrong while analyzing the resume.",
      },
      { status: 500 }
    );
  }
}
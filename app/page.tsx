"use client";

import React, {
  ChangeEvent,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { createClient } from "../utils/supabase/client";

type AnalysisResult = {
  atsScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  importantKeywords: string[];
  responsibilities: string[];
  tailoredResume: string;
};

const supabase = createClient();

function cleanText(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/\*\*/g, "")
    .replace(/CEHV13/gi, "CEH V13")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function SkillChip({
  children,
  missing = false,
}: {
  children: ReactNode;
  missing?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium ${
        missing
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {missing ? "+" : "✓"} {children}
    </span>
  );
}

function KeywordChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm">
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h4 className="mb-3 border-b border-slate-200 pb-2 text-sm font-bold tracking-wide text-slate-900">
      {children}
    </h4>
  );
}

function ResumeContent({ resume }: { resume: string }) {
  const text = cleanText(resume);

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const headings = new Set([
    "PROFESSIONAL SUMMARY",
    "SUMMARY",
    "SKILLS",
    "TECHNICAL SKILLS",
    "PROJECTS",
    "CERTIFICATIONS",
    "EDUCATION",
    "EXPERIENCE",
    "INTERNSHIPS",
  ]);

  let candidateName = "SUSHANTH REDDY";
  let candidateTitle = "Cybersecurity | Ethical Hacking | Security Analysis";

  let startIndex = 0;

  if (
    lines[0] &&
    !headings.has(lines[0].toUpperCase()) &&
    lines[0].length < 60
  ) {
    candidateName = lines[0];
    startIndex = 1;

    if (
      lines[1] &&
      !headings.has(lines[1].toUpperCase()) &&
      lines[1].length < 100
    ) {
      candidateTitle = lines[1];
      startIndex = 2;
    }
  }

  const contentLines = lines.slice(startIndex);

  const isHeading = (line: string) =>
    headings.has(line.toUpperCase().replace(/:$/, "").trim());

  const isProjectTitle = (line: string) => {
    const lower = line.toLowerCase();

    return (
      lower.includes("(python") ||
      lower.includes("(react") ||
      lower.includes("(typescript") ||
      lower.includes("(supabase") ||
      lower.includes("(nmap") ||
      lower.includes("toolkit") ||
      lower.includes("scanner") ||
      lower.includes("authentication system")
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-7 border-b border-slate-200 pb-5 text-center">
        <h3 className="text-2xl font-extrabold tracking-tight text-slate-950">
          {candidateName.toUpperCase()}
        </h3>

        <p className="mt-1 text-sm font-medium text-slate-600">
          {candidateTitle}
        </p>
      </div>

      <div className="space-y-6 text-sm leading-6 text-slate-700">
        {contentLines.map((line, index) => {
          const normalized = line.toUpperCase().replace(/:$/, "").trim();

          if (isHeading(line)) {
            return (
              <div key={index} className="pt-1">
                <SectionTitle>{normalized}</SectionTitle>
              </div>
            );
          }

          if (isProjectTitle(line)) {
            return (
              <div key={index} className="pt-2">
                <p className="font-bold text-slate-900">{line}</p>
              </div>
            );
          }

          const bullet = line.startsWith("•") || line.startsWith("-");

          return (
            <p
              key={index}
              className={bullet ? "pl-3" : ""}
            >
              {line}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserEmail(user?.email ?? null);
      setAuthLoading(false);
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserEmail(null);
    window.location.href = "/";
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    setResumeFile(file);
    setError("");
  }

  async function analyzeResume() {
    if (!resumeFile) {
      setError("Please upload your resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please paste the job description.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();

      formData.append("resume", resumeFile);
      formData.append("jobDescription", jobDescription);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed.");
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

 async function unlockApplication() {
  try {
    // Load Razorpay checkout
    if (!(window as any).Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Razorpay failed to load."));
        document.body.appendChild(script);
      });
    }

    // Create payment order
    const response = await fetch("/api/payment/create-order", {
      method: "POST",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to create payment order.");
    }

    const options = {
      key: data.key_id,
      amount: data.amount,
      currency: data.currency,
      name: "ResumeAI",
      description: "Single Application Package",
      order_id: data.id,
      prefill: {
        email: userEmail || "",
      },
      theme: {
        color: "#2563eb",
      },
      handler: async function (payment: any) {
        try {
          const verifyResponse = await fetch("/api/payment/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              razorpay_order_id: payment.razorpay_order_id,
              razorpay_payment_id: payment.razorpay_payment_id,
              razorpay_signature: payment.razorpay_signature,
            }),
          });

          const result = await verifyResponse.json();

          if (!verifyResponse.ok) {
            throw new Error(
              result.error || "Payment verification failed."
            );
          }

          alert("Payment successful! Your application is unlocked.");
        } catch (error) {
          alert(
            error instanceof Error
              ? error.message
              : "Payment verification failed."
          );
        }
      },
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Payment initialization failed."
    );
  }
}

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <a
            href="#top"
            className="text-xl font-extrabold tracking-tight text-slate-950"
          >
            ResumeAI
          </a>

          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a
              href="#how-it-works"
              className="hover:text-blue-600"
            >
              How it works
            </a>

            <a
              href="#pricing"
              className="hover:text-blue-600"
            >
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-3">
            {!authLoading && userEmail ? (
              <>
                <span className="hidden max-w-[220px] truncate text-sm font-medium text-slate-600 sm:block">
                  {userEmail}
                </span>

                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  Login
                </a>

                <a
                  href="#analyzer"
                  className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Try Free
                </a>
              </>
            )}
          </div>

        </div>
      </nav>

      {/* HERO */}
      <section
        id="top"
        className="border-b border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">

          <p className="mb-4 text-sm font-bold tracking-[0.2em] text-blue-600">
            AI-POWERED JOB APPLICATION ASSISTANT
          </p>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-slate-950 md:text-6xl">
            Turn your resume into a{" "}
            <span className="text-blue-600">
              job-ready application
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Upload your resume, paste a job description, and get an
            AI-powered match analysis with a tailored resume preview.
          </p>

          <a
            href="#analyzer"
            className="mt-8 inline-flex rounded-xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Analyze My Resume →
          </a>

        </div>
      </section>

      {/* ANALYZER */}
      <section
        id="analyzer"
        className="mx-auto max-w-7xl px-6 py-16"
      >

        <div className="grid gap-8 lg:grid-cols-2">

          {/* RESUME */}
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

            <div className="mb-5 flex items-start gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                📄
              </div>

              <div>
                <p className="font-bold text-slate-950">
                  1. Upload your resume
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  PDF, DOCX or text resume
                </p>
              </div>

            </div>

            <label className="block cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-7 text-center transition hover:border-blue-400 hover:bg-blue-50/30">

              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />

              {resumeFile ? (
                <div>

                  <p className="font-semibold text-slate-900">
                    📄 {resumeFile.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {resumeFile.type || "Resume file"}
                  </p>

                  <p className="mt-3 text-sm font-semibold text-emerald-600">
                    ✓ Resume ready for analysis
                  </p>

                </div>
              ) : (
                <>
                  <p className="font-semibold text-slate-800">
                    Click to upload resume
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    PDF, DOCX or TXT
                  </p>
                </>
              )}

            </label>

          </div>

          {/* JOB DESCRIPTION */}
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

            <div className="mb-5 flex items-start gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-xl">
                💼
              </div>

              <div>
                <p className="font-bold text-slate-950">
                  2. Add the job description
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Paste the complete job description
                </p>
              </div>

            </div>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="h-52 w-full resize-none rounded-xl border border-slate-300 p-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <div className="mt-2 text-right text-xs text-slate-400">
              {jobDescription.length} characters
            </div>

          </div>

        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={analyzeResume}
          disabled={loading}
          className="mt-8 w-full rounded-xl bg-slate-950 px-6 py-4 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Analyzing with AI..."
            : "Analyze My Resume"}
        </button>

        {/* RESULTS */}
        {result && (
          <div className="mt-16">

            <div className="mb-10 text-center">

              <p className="text-sm font-bold tracking-[0.2em] text-emerald-600">
                ANALYSIS COMPLETE
              </p>

              <h2 className="mt-3 text-3xl font-extrabold text-slate-950">
                Your Job Match
              </h2>

              <p className="mt-3 text-slate-500">
                Here is how your resume matches this job description.
              </p>

            </div>

            {/* SCORE */}
            <div className="grid gap-6 md:grid-cols-3">

              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

                <p className="text-xs font-bold tracking-wider text-slate-500">
                  ATS JOB MATCH
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  AI Analysis
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Resume-to-job compatibility
                </p>

                <div className="mt-5 text-5xl font-extrabold text-blue-600">
                  {result.atsScore}%
                </div>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

                <p className="text-xs font-bold tracking-wider text-slate-500">
                  MATCHING SKILLS
                </p>

                <div className="mt-2 flex items-end gap-2">

                  <span className="text-4xl font-extrabold text-slate-950">
                    {result.matchingSkills.length}
                  </span>

                  <span className="pb-1 text-sm text-slate-500">
                    Found
                  </span>

                </div>

                <div className="mt-5 flex flex-wrap gap-2">

                  {result.matchingSkills.map((skill) => (
                    <SkillChip key={skill}>
                      {skill}
                    </SkillChip>
                  ))}

                </div>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

                <p className="text-xs font-bold tracking-wider text-slate-500">
                  MISSING SKILLS
                </p>

                <div className="mt-2 flex items-end gap-2">

                  <span className="text-4xl font-extrabold text-slate-950">
                    {result.missingSkills.length}
                  </span>

                  <span className="pb-1 text-sm text-slate-500">
                    Gaps
                  </span>

                </div>

                <div className="mt-5 flex flex-wrap gap-2">

                  {result.missingSkills.map((skill) => (
                    <SkillChip
                      key={skill}
                      missing
                    >
                      {skill}
                    </SkillChip>
                  ))}

                </div>

              </div>

            </div>

            {/* KEYWORDS */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

              <p className="text-xs font-bold tracking-wider text-blue-600">
                ATS KEYWORDS
              </p>

              <h3 className="mt-2 text-xl font-bold text-slate-950">
                Important keywords
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {result.importantKeywords.length} keywords detected from the job description
              </p>

              <div className="mt-5 flex flex-wrap gap-2">

                {result.importantKeywords.map((keyword) => (
                  <KeywordChip key={keyword}>
                    {keyword}
                  </KeywordChip>
                ))}

              </div>

            </div>

            {/* RESPONSIBILITIES */}
            {result.responsibilities?.length > 0 && (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

                <p className="text-xs font-bold tracking-wider text-blue-600">
                  JOB RESPONSIBILITIES
                </p>

                <h3 className="mt-2 text-xl font-bold text-slate-950">
                  What this job expects
                </h3>

                <div className="mt-5 grid gap-3 md:grid-cols-2">

                  {result.responsibilities.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                    >
                      <span className="mr-2 font-bold text-blue-600">
                        {index + 1}.
                      </span>

                      {item}
                    </div>
                  ))}

                </div>

              </div>
            )}

            {/* TAILORED RESUME */}
            <div className="mt-12">

              <div className="mb-6 text-center">

                <p className="text-sm font-bold tracking-[0.2em] text-blue-600">
                  AI TAILORED RESUME
                </p>

                <h2 className="mt-3 text-3xl font-extrabold text-slate-950">
                  Job-Optimized Resume Preview
                </h2>

                <p className="mt-3 text-slate-500">
                  Your resume is tailored specifically for this job.
                </p>

              </div>

              <ResumeContent
                resume={result.tailoredResume}
              />

            </div>

            {/* PREMIUM APPLICATION */}
            <div className="mt-12 overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-sm">

              <div className="p-8 md:p-10">

                <p className="text-sm font-bold tracking-[0.18em] text-blue-600">
                  PREMIUM APPLICATION
                </p>

                <h2 className="mt-3 text-3xl font-extrabold text-slate-950">
                  Unlock your complete job application
                </h2>

                <p className="mt-3 max-w-2xl text-slate-600">
                  Get everything you need to move from resume analysis to application.
                </p>

                <div className="mt-7 grid gap-3 md:grid-cols-2">

                  {[
                    "Fully tailored resume",
                    "PDF & DOCX download",
                    "Personalized cover letter",
                    "Recruiter message",
                    "Interview preparation",
                    "Job-specific improvements",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl bg-white/80 p-3 text-sm font-medium text-slate-700"
                    >
                      ✓ {item}
                    </div>
                  ))}

                </div>

                <div className="mt-8 flex flex-col gap-5 rounded-2xl border border-blue-100 bg-white p-6 md:flex-row md:items-center md:justify-between">

                  <div>

                    <p className="text-sm font-bold text-slate-500">
                      SINGLE APPLICATION
                    </p>

                    <div className="mt-1 flex items-baseline gap-2">

                      <span className="text-4xl font-extrabold text-slate-950">
                        ₹199
                      </span>

                      <span className="text-sm text-slate-500">
                        one application
                      </span>

                    </div>

                  </div>

                  <button
                    onClick={unlockApplication}
                    className="rounded-xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                  >
                    Unlock Full Application →
                  </button>

                </div>

                <p className="mt-4 text-center text-xs text-slate-400">
                  Secure payment • Instant access
                </p>

              </div>

            </div>

          </div>
        )}

      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="border-y border-slate-200 bg-white"
      >

        <div className="mx-auto max-w-7xl px-6 py-20">

          <div className="text-center">

            <p className="text-sm font-bold tracking-[0.2em] text-blue-600">
              HOW IT WORKS
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-slate-950">
              From resume to application
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-slate-500">
              Four simple steps to turn your existing resume into a job-specific application.
            </p>

          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-4">

            {[
              ["01", "Upload Resume", "Add your existing resume."],
              ["02", "Add Job", "Paste the job description."],
              [
                "03",
                "Analyze & Tailor",
                "Identify matches, gaps and job-specific improvements.",
              ],
              [
                "04",
                "Apply",
                "Unlock the complete application package.",
              ],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
              >

                <span className="text-sm font-extrabold text-blue-600">
                  {number}
                </span>

                <h3 className="mt-5 text-lg font-bold text-slate-950">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {description}
                </p>

              </div>
            ))}

          </div>

        </div>

      </section>

      {/* PRICING */}
      <section
        id="pricing"
        className="bg-slate-50"
      >

        <div className="mx-auto max-w-7xl px-6 py-20">

          <div className="text-center">

            <p className="text-sm font-bold tracking-[0.2em] text-blue-600">
              SIMPLE PRICING
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-slate-950">
              Choose how you want to use ResumeAI
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-slate-500">
              Start free. Pay for individual applications or let ResumeAI help manage your entire job hunt.
            </p>

          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">

            {/* FREE */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

              <p className="text-sm font-bold text-slate-500">
                FREE
              </p>

              <div className="mt-3 text-4xl font-extrabold text-slate-950">
                ₹0
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Start analyzing your applications.
              </p>

              <div className="mt-7 space-y-3 text-sm text-slate-700">
                <p>✓ Resume analysis</p>
                <p>✓ ATS job match</p>
                <p>✓ Matching skills</p>
                <p>✓ Missing skills</p>
                <p>✓ ATS keywords</p>
                <p>✓ Tailored resume preview</p>
              </div>

              <a
                href="#analyzer"
                className="mt-8 block rounded-xl border border-slate-300 px-5 py-3 text-center font-bold text-slate-800 transition hover:bg-slate-50"
              >
                Start Free
              </a>

            </div>

            {/* SINGLE APPLICATION */}
            <div className="relative rounded-2xl border-2 border-blue-500 bg-white p-7 shadow-xl shadow-blue-500/10">

              <div className="absolute right-5 top-5 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                POPULAR
              </div>

              <p className="text-sm font-bold text-blue-600">
                SINGLE APPLICATION
              </p>

              <div className="mt-3 text-4xl font-extrabold text-slate-950">
                ₹199
              </div>

              <p className="mt-2 text-sm text-slate-500">
                One complete application package.
              </p>

              <div className="mt-7 space-y-3 text-sm text-slate-700">
                <p>✓ Everything in Free</p>
                <p>✓ Fully tailored resume</p>
                <p>✓ PDF/DOCX download</p>
                <p>✓ Personalized cover letter</p>
                <p>✓ Recruiter message</p>
                <p>✓ Interview preparation</p>
                <p>✓ Job-specific improvements</p>
              </div>

              <button
                onClick={unlockApplication}
                className="mt-8 w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
              >
                Get Application →
              </button>

            </div>

            {/* JOB HUNTER */}
            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-7 text-white shadow-xl">

              <p className="text-sm font-bold text-blue-300">
                JOB HUNTER
              </p>

              <div className="mt-3 flex items-baseline gap-2">

                <span className="text-4xl font-extrabold">
                  ₹599
                </span>

                <span className="text-sm text-slate-400">
                  /month
                </span>

              </div>

              <p className="mt-2 text-sm text-slate-400">
                Your AI assistant for the entire job hunt.
              </p>

              <div className="mt-7 space-y-3 text-sm text-slate-200">
                <p>✓ Find relevant jobs</p>
                <p>✓ Personalized job recommendations</p>
                <p>✓ AI job-fit analysis</p>
                <p>✓ Multiple tailored applications</p>
                <p>✓ Cover letters</p>
                <p>✓ Recruiter messages</p>
                <p>✓ Interview preparation</p>
                <p>✓ Application tracking</p>
                <p>✓ Skill-gap analysis</p>
              </div>

              <button
                onClick={() =>
                  alert(
                    "Job Hunter subscription will be connected here. Price: ₹599/month."
                  )
                }
                className="mt-8 w-full rounded-xl bg-white px-5 py-3 font-bold text-slate-950 transition hover:bg-slate-100"
              >
                Start Job Hunter →
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-6 py-8 text-center">

          <p className="font-extrabold text-slate-950">
            ResumeAI
          </p>

          <p className="mt-2 text-sm text-slate-500">
            © 2026 ResumeAI. AI-powered job applications.
          </p>

        </div>

      </footer>

    </main>
  );
}

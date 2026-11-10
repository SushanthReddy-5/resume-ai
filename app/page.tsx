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
